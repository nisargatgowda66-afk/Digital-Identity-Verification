import hashlib
import os
import shutil
import time
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import init_db, get_db, IdentityRecord, VerificationLog
from blockchain import SimulatedBlockchain
from contract_manager import GanacheContractManager

# Initialize database
init_db()

# Initialize Blockchain Systems
simulated_blockchain = SimulatedBlockchain(difficulty=2)
ganache_manager = GanacheContractManager()

app = FastAPI(
    title="Digital Identity Verification Using Blockchain",
    description="Decentralized Identity Verification System using SHA-256 hashing, FastAPI, SQLite, and Blockchain (Simulated PoW Ledger + Ganache EVM)",
    version="1.0.0"
)

# Enable CORS for Vite frontend (typically localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory for sample testing files
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Application state
app_state = {
    "active_mode": "AUTO"  # "AUTO", "SIMULATED", or "GANACHE"
}

def determine_active_mode() -> str:
    if app_state["active_mode"] == "SIMULATED":
        return "SIMULATED"
    if app_state["active_mode"] == "GANACHE":
        return "ETHEREUM_GANACHE"
    # In AUTO mode, check if Ganache is active with a deployed contract
    status = ganache_manager.get_status()
    if status.get("connected") and status.get("contract_deployed"):
        return "ETHEREUM_GANACHE"
    return "SIMULATED"

def calculate_sha256(content: bytes) -> str:
    """Cryptographic SHA-256 hash of raw file/document bytes."""
    return hashlib.sha256(content).hexdigest()

@app.get("/")
def read_root():
    return {
        "project": "Digital Identity Verification Using Blockchain",
        "status": "Online",
        "timestamp": datetime.utcnow().isoformat(),
        "blockchain_mode": determine_active_mode(),
        "endpoints": {
            "register": "POST /api/register",
            "verify": "POST /api/verify",
            "history": "GET /api/history",
            "blockchain": "GET /api/blockchain",
            "stats": "GET /api/stats",
            "identities": "GET /api/identities",
            "seed_samples": "POST /api/sample-data"
        }
    }

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total_identities = db.query(IdentityRecord).count()
    total_verifications = db.query(VerificationLog).count()
    valid_verifications = db.query(VerificationLog).filter(VerificationLog.is_valid == True).count()
    tampered_verifications = db.query(VerificationLog).filter(
        VerificationLog.is_valid == False,
        VerificationLog.expected_hash.isnot(None)
    ).count()

    blockchain_summary = simulated_blockchain.get_summary()
    ganache_status = ganache_manager.get_status()

    return {
        "total_identities": total_identities,
        "total_verifications": total_verifications,
        "valid_verifications": valid_verifications,
        "tampered_attempts": tampered_verifications,
        "blockchain_mode": determine_active_mode(),
        "simulated_chain": blockchain_summary,
        "ganache_node": ganache_status
    }

@app.post("/api/register")
async def register_identity(
    identity_id: str = Form(..., description="Unique alphanumeric ID, e.g., STU-2024-001"),
    full_name: str = Form(..., description="Full Name of the identity holder"),
    email: str = Form(..., description="Email address"),
    document_type: str = Form(..., description="Identity document type (e.g. Passport, Student ID, Aadhaar)"),
    document: UploadFile = File(..., description="Sample Identity Document file"),
    db: Session = Depends(get_db)
):
    # Normalize inputs
    identity_id = identity_id.strip().upper()
    full_name = full_name.strip()
    email = email.strip()
    document_type = document_type.strip()

    if not identity_id:
        raise HTTPException(status_code=400, detail="Identity ID cannot be empty.")
    if not full_name:
        raise HTTPException(status_code=400, detail="Full name cannot be empty.")
    if not email:
        raise HTTPException(status_code=400, detail="Email cannot be empty.")

    # Check if identity already exists in SQLite
    existing_record = db.query(IdentityRecord).filter(IdentityRecord.identity_id == identity_id).first()
    if existing_record:
        raise HTTPException(
            status_code=400,
            detail=f"Identity ID '{identity_id}' is already registered in the system on block #{existing_record.block_number}."
        )

    # Read document bytes and calculate cryptographic SHA-256 hash
    content = await document.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded document is empty (0 bytes).")

    doc_hash = calculate_sha256(content)
    file_size = len(content)
    safe_filename = document.filename or "sample_identity_doc.dat"

    # Save a sanitized copy in uploads for verification tests if needed
    save_path = os.path.join(UPLOAD_DIR, f"{identity_id}_{safe_filename}")
    with open(save_path, "wb") as f:
        f.write(content)

    # Record on Blockchain
    mode = determine_active_mode()
    tx_hash = ""
    block_number = 1

    # First, always record in the simulated cryptographic ledger
    sim_result = simulated_blockchain.register_identity(identity_id, doc_hash)
    tx_hash = sim_result["tx_hash"]
    block_number = sim_result["block_number"]

    # If Ganache is active with smart contract, also send to Ethereum
    if mode == "ETHEREUM_GANACHE" and ganache_manager.contract:
        try:
            eth_result = ganache_manager.register_identity(identity_id, doc_hash)
            tx_hash = eth_result["tx_hash"]
            block_number = eth_result["block_number"]
        except Exception as e:
            print(f"[Register] Ganache contract call failed: {e}. Falling back to simulated ledger.")
            mode = "SIMULATED"

    # Store record in SQLite database
    new_identity = IdentityRecord(
        identity_id=identity_id,
        full_name=full_name,
        email=email,
        document_type=document_type,
        document_filename=safe_filename,
        document_hash=doc_hash,
        document_size=file_size,
        created_at=datetime.utcnow(),
        tx_hash=tx_hash,
        block_number=block_number,
        blockchain_mode=mode
    )
    db.add(new_identity)
    db.commit()
    db.refresh(new_identity)

    # Log initial registration in verification history
    init_log = VerificationLog(
        identity_id=identity_id,
        provided_hash=doc_hash,
        expected_hash=doc_hash,
        is_valid=True,
        status_message="Initial identity registration and blockchain hash commitment.",
        tx_reference=tx_hash,
        block_number=block_number,
        blockchain_mode=mode,
        verified_at=datetime.utcnow()
    )
    db.add(init_log)
    db.commit()

    return {
        "success": True,
        "message": f"Digital identity for '{full_name}' registered successfully and committed to the blockchain.",
        "identity_id": identity_id,
        "full_name": full_name,
        "email": email,
        "document_type": document_type,
        "document_filename": safe_filename,
        "document_hash": doc_hash,
        "document_size_bytes": file_size,
        "tx_hash": tx_hash,
        "block_number": block_number,
        "blockchain_mode": mode,
        "created_at": new_identity.created_at.isoformat()
    }

@app.post("/api/verify")
async def verify_identity(
    identity_id: str = Form(..., description="Identity ID to verify"),
    document: UploadFile = File(..., description="Document file to test against blockchain hash"),
    db: Session = Depends(get_db)
):
    identity_id = identity_id.strip().upper()
    if not identity_id:
        raise HTTPException(status_code=400, detail="Identity ID cannot be empty.")

    # Read uploaded document
    content = await document.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded verification file is empty.")

    computed_hash = calculate_sha256(content)
    mode = determine_active_mode()

    # Query local SQLite record
    record = db.query(IdentityRecord).filter(IdentityRecord.identity_id == identity_id).first()

    if not record:
        # Identity not found in database
        status_msg = f"Identity ID '{identity_id}' was NOT found in the system registry or blockchain."
        log_entry = VerificationLog(
            identity_id=identity_id,
            provided_hash=computed_hash,
            expected_hash=None,
            is_valid=False,
            status_message=status_msg,
            tx_reference=None,
            block_number=0,
            blockchain_mode=mode,
            verified_at=datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()

        return JSONResponse(
            status_code=200,
            content={
                "is_valid": False,
                "is_not_found": True,
                "is_tampered": False,
                "status": "NOT_FOUND",
                "message": status_msg,
                "identity_id": identity_id,
                "computed_hash": computed_hash,
                "stored_hash": None,
                "full_name": None,
                "document_type": None,
                "blockchain_mode": mode,
                "verified_at": datetime.utcnow().isoformat()
            }
        )

    stored_hash = record.document_hash
    is_match = (computed_hash.lower() == stored_hash.lower())

    # Execute verification audit on the blockchain
    tx_ref = record.tx_hash
    blk_num = record.block_number

    if is_match:
        status_msg = f"MATCH CONFIRMED: Digital identity verified successfully! The SHA-256 hash matches the immutable blockchain record on Block #{blk_num}."
    else:
        status_msg = f"TAMPER ALERT: The uploaded document has been modified! The calculated hash does not match the registered hash committed to the blockchain."

    # Record in simulated blockchain audit trail
    sim_valid, sim_rec, sim_msg = simulated_blockchain.verify_identity(identity_id, computed_hash)

    # Save verification attempt in history database
    log_entry = VerificationLog(
        identity_id=identity_id,
        provided_hash=computed_hash,
        expected_hash=stored_hash,
        is_valid=is_match,
        status_message=status_msg,
        tx_reference=tx_ref,
        block_number=blk_num,
        blockchain_mode=mode,
        verified_at=datetime.utcnow()
    )
    db.add(log_entry)
    db.commit()

    return {
        "is_valid": is_match,
        "is_not_found": False,
        "is_tampered": not is_match,
        "status": "VALID" if is_match else "TAMPERED",
        "message": status_msg,
        "identity_id": identity_id,
        "full_name": record.full_name,
        "document_type": record.document_type,
        "computed_hash": computed_hash,
        "stored_hash": stored_hash,
        "original_filename": record.document_filename,
        "uploaded_filename": document.filename,
        "tx_reference": tx_ref,
        "block_number": blk_num,
        "blockchain_mode": record.blockchain_mode,
        "registered_at": record.created_at.isoformat(),
        "verified_at": log_entry.verified_at.isoformat()
    }

@app.get("/api/history")
def get_verification_history(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(VerificationLog).order_by(desc(VerificationLog.verified_at)).limit(limit).all()
    results = []
    for l in logs:
        # Fetch associated name if available
        id_rec = db.query(IdentityRecord).filter(IdentityRecord.identity_id == l.identity_id).first()
        results.append({
            "id": l.id,
            "identity_id": l.identity_id,
            "full_name": id_rec.full_name if id_rec else "Unknown / Unregistered",
            "document_type": id_rec.document_type if id_rec else "N/A",
            "is_valid": l.is_valid,
            "status_message": l.status_message,
            "provided_hash": l.provided_hash,
            "expected_hash": l.expected_hash,
            "tx_reference": l.tx_reference,
            "block_number": l.block_number,
            "blockchain_mode": l.blockchain_mode,
            "verified_at": l.verified_at.isoformat()
        })
    return results

@app.get("/api/blockchain")
def get_blockchain_data():
    summary = simulated_blockchain.get_summary()
    blocks = simulated_blockchain.get_all_blocks()
    ganache_info = ganache_manager.get_status()

    return {
        "active_mode": determine_active_mode(),
        "summary": summary,
        "blocks": blocks,
        "ganache": ganache_info
    }

@app.get("/api/identities")
def list_identities(db: Session = Depends(get_db)):
    identities = db.query(IdentityRecord).order_by(desc(IdentityRecord.created_at)).all()
    return [
        {
            "id": i.id,
            "identity_id": i.identity_id,
            "full_name": i.full_name,
            "email": i.email,
            "document_type": i.document_type,
            "document_filename": i.document_filename,
            "document_hash": i.document_hash,
            "document_size": i.document_size,
            "created_at": i.created_at.isoformat(),
            "tx_hash": i.tx_hash,
            "block_number": i.block_number,
            "blockchain_mode": i.blockchain_mode
        }
        for i in identities
    ]

@app.get("/api/identity/{identity_id}")
def get_identity_details(identity_id: str, db: Session = Depends(get_db)):
    identity_id = identity_id.strip().upper()
    record = db.query(IdentityRecord).filter(IdentityRecord.identity_id == identity_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Identity '{identity_id}' not found.")

    history = db.query(VerificationLog).filter(
        VerificationLog.identity_id == identity_id
    ).order_by(desc(VerificationLog.verified_at)).all()

    on_chain_sim = simulated_blockchain.get_identity(identity_id)

    return {
        "identity_id": record.identity_id,
        "full_name": record.full_name,
        "email": record.email,
        "document_type": record.document_type,
        "document_filename": record.document_filename,
        "document_hash": record.document_hash,
        "document_size": record.document_size,
        "created_at": record.created_at.isoformat(),
        "tx_hash": record.tx_hash,
        "block_number": record.block_number,
        "blockchain_mode": record.blockchain_mode,
        "on_chain_record": on_chain_sim,
        "verifications_count": len(history),
        "history": [
            {
                "id": h.id,
                "is_valid": h.is_valid,
                "status_message": h.status_message,
                "provided_hash": h.provided_hash,
                "verified_at": h.verified_at.isoformat(),
                "tx_reference": h.tx_reference
            }
            for h in history
        ]
    }

@app.post("/api/deploy-contract")
def deploy_smart_contract():
    """Deploy Solidity contract to connected Ganache node."""
    status = ganache_manager.get_status()
    if not status["connected"]:
        raise HTTPException(
            status_code=400,
            detail="Ganache node is not running on ports 8545 or 7545. Please start Ganache first."
        )

    result = ganache_manager.deploy_contract()
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Deployment failed."))

    return {
        "success": True,
        "message": "Solidity contract IdentityVerification deployed to Ganache successfully!",
        "contract_address": result["contract_address"],
        "tx_hash": result["tx_hash"],
        "block_number": result["block_number"],
        "deployer": result["deployer"]
    }

@app.post("/api/blockchain/mode")
def set_blockchain_mode(mode: str = Query(..., pattern="^(AUTO|SIMULATED|GANACHE)$")):
    app_state["active_mode"] = mode
    return {
        "success": True,
        "active_mode": app_state["active_mode"],
        "resolved_mode": determine_active_mode()
    }

@app.post("/api/sample-data")
def seed_sample_data(db: Session = Depends(get_db)):
    """
    Seed 3 fictional student identities and sample documents for instant demonstration.
    Allows testing valid verification and tampered document verification instantly.
    """
    samples = [
        {
            "identity_id": "STU-2024-8841",
            "full_name": "Aarav Sharma",
            "email": "aarav.sharma@example.edu",
            "document_type": "Student ID Card",
            "filename": "aarav_student_id.txt",
            "content": b"NAME: Aarav Sharma | ID: STU-2024-8841 | DEPT: Computer Science | YEAR: 2024 | ISSUER: National Tech University"
        },
        {
            "identity_id": "PASSPORT-IN-90412",
            "full_name": "Priya Patel",
            "email": "priya.patel@example.com",
            "document_type": "Passport",
            "filename": "priya_passport_scan.txt",
            "content": b"DOCUMENT: PASSPORT | COUNTRY: INDIA | NO: Z8192041 | HOLDER: Priya Patel | DOB: 2002-05-14 | EXPIRY: 2032-05-13"
        },
        {
            "identity_id": "EMP-DL-4410",
            "full_name": "Rohan Verma",
            "email": "rohan.verma@example.org",
            "document_type": "Driver's License",
            "filename": "rohan_drivers_license.txt",
            "content": b"LICENSE: DL-9012384 | HOLDER: Rohan Verma | CLASS: LMV | ISSUE_DATE: 2021-08-10 | VALID_TILL: 2041-08-09"
        }
    ]

    created = []
    mode = determine_active_mode()

    for s in samples:
        existing = db.query(IdentityRecord).filter(IdentityRecord.identity_id == s["identity_id"]).first()
        if existing:
            continue

        doc_hash = calculate_sha256(s["content"])
        
        # Save sample file on disk so student can download or test it directly
        file_path = os.path.join(UPLOAD_DIR, s["filename"])
        with open(file_path, "wb") as f:
            f.write(s["content"])

        # Also create a 'tampered' version for easy demonstration
        tampered_path = os.path.join(UPLOAD_DIR, f"tampered_{s['filename']}")
        with open(tampered_path, "wb") as f:
            f.write(s["content"] + b" [UNAUTHORIZED TAMPERING / MODIFIED DATA]")

        # Register on simulated blockchain
        sim_res = simulated_blockchain.register_identity(s["identity_id"], doc_hash)
        tx_h = sim_res["tx_hash"]
        blk_n = sim_res["block_number"]

        record = IdentityRecord(
            identity_id=s["identity_id"],
            full_name=s["full_name"],
            email=s["email"],
            document_type=s["document_type"],
            document_filename=s["filename"],
            document_hash=doc_hash,
            document_size=len(s["content"]),
            created_at=datetime.utcnow(),
            tx_hash=tx_h,
            block_number=blk_n,
            blockchain_mode="SIMULATED"
        )
        db.add(record)
        db.commit()

        # Add history log
        log = VerificationLog(
            identity_id=s["identity_id"],
            provided_hash=doc_hash,
            expected_hash=doc_hash,
            is_valid=True,
            status_message="Sample test identity registered and committed to blockchain.",
            tx_reference=tx_h,
            block_number=blk_n,
            blockchain_mode="SIMULATED",
            verified_at=datetime.utcnow()
        )
        db.add(log)
        db.commit()

        created.append(s["identity_id"])

    return {
        "success": True,
        "message": f"Seeded {len(created)} fictional sample identities for testing.",
        "sample_identities": created,
        "demo_guide": {
            "valid_test": "Upload the sample document to verify (Hash matches -> Green success).",
            "tamper_test": "Upload the tampered document or modify 1 letter to verify (Hash mismatch -> Red tamper alert)."
        }
    }

@app.get("/api/download-sample/{filename}")
def download_sample_file(filename: str):
    """Allow downloading sample test files from browser for instant testing."""
    safe_name = os.path.basename(filename)
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")
    from fastapi.responses import FileResponse
    return FileResponse(file_path, filename=safe_name, media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
