import os
import io
import hashlib
from fastapi.testclient import TestClient

# Ensure working directory is backend
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app, calculate_sha256, simulated_blockchain

client = TestClient(app)

def run_all_tests():
    print("=" * 60)
    print("RUNNING AUTOMATED TEST SUITE FOR BLOCKCHAIN IDENTITY SYSTEM")
    print("=" * 60)

    # TEST CASE 6: SHA-256 Determinism and Consistency
    print("\n[TEST 6] Testing SHA-256 hash determinism...")
    doc1 = b"Identity Proof Document for Alice Wonderland 2024"
    doc2 = b"Identity Proof Document for Alice Wonderland 2024"
    hash1 = calculate_sha256(doc1)
    hash2 = calculate_sha256(doc2)
    assert hash1 == hash2, "Hashing failed determinism check!"
    assert len(hash1) == 64, "SHA-256 hash must be 64 hexadecimal characters"
    print(f" PASS: Identical documents produce identical SHA-256: {hash1[:16]}...")

    # TEST CASE 3 (Part A): Cryptographic Avalanche Effect (Tamper sensitivity)
    print("\n[TEST 3a] Testing cryptographic sensitivity to single-byte modification...")
    tampered_doc = b"Identity Proof Document for Alice Wonderland 2025" # single character change
    tampered_hash = calculate_sha256(tampered_doc)
    assert hash1 != tampered_hash, "Hash collision! Single byte change must alter hash entirely"
    print(f" PASS: 1-character modification changed hash from:\n  Orig: {hash1}\n  Tamp: {tampered_hash}")

    # TEST CASE 5: Handle empty or invalid inputs
    print("\n[TEST 5] Testing empty and invalid input handling...")
    # Empty identity ID
    res = client.post("/api/register", data={"identity_id": "", "full_name": "Test", "email": "a@b.com", "document_type": "Passport"}, files={"document": ("test.txt", io.BytesIO(b"content"), "text/plain")})
    assert res.status_code in (400, 422), f"Expected 400 or 422 for empty identity_id, got {res.status_code}"
    
    # Empty file
    res = client.post("/api/register", data={"identity_id": "TEST-EMPTY-FILE", "full_name": "Test", "email": "a@b.com", "document_type": "Passport"}, files={"document": ("test.txt", io.BytesIO(b""), "text/plain")})
    assert res.status_code in (400, 422), f"Expected 400 or 422 for empty file, got {res.status_code}"
    print(f" PASS: System correctly rejected empty ID and empty document with HTTP {res.status_code}.")

    # TEST CASE 1: Register a new identity successfully
    print("\n[TEST 1] Testing successful identity registration...")
    import time
    test_id = f"STU-UNITEST-{int(time.time())}"
    sample_content = f"STUDENT IDENTITY CARD - UNIVERSITY OF TECHNOLOGY - NAME: John Doe - ID: {test_id}".encode()
    res = client.post(
        "/api/register",
        data={
            "identity_id": test_id,
            "full_name": "John Doe",
            "email": "johndoe@student.edu",
            "document_type": "Student ID Card"
        },
        files={"document": ("john_card.txt", io.BytesIO(sample_content), "text/plain")}
    )
    assert res.status_code == 200, f"Registration failed: {res.text}"
    reg_data = res.json()
    assert reg_data["success"] is True
    assert reg_data["identity_id"] == test_id
    assert reg_data["document_hash"] == calculate_sha256(sample_content)
    assert "tx_hash" in reg_data
    assert reg_data["block_number"] >= 1
    print(f" PASS: Registered 'John Doe' on Block #{reg_data['block_number']} with Tx {reg_data['tx_hash'][:20]}...")

    # Duplicate registration check
    res_dup = client.post(
        "/api/register",
        data={
            "identity_id": test_id,
            "full_name": "John Doe Again",
            "email": "johndoe@student.edu",
            "document_type": "Student ID Card"
        },
        files={"document": ("john_card.txt", io.BytesIO(sample_content), "text/plain")}
    )
    assert res_dup.status_code == 400, "Duplicate identity_id should be rejected"
    print(" PASS: Duplicate identity ID registration correctly rejected.")

    # TEST CASE 2: Verify registered identity successfully
    print("\n[TEST 2] Testing successful verification with matching document...")
    res_verify = client.post(
        "/api/verify",
        data={"identity_id": test_id},
        files={"document": ("john_card.txt", io.BytesIO(sample_content), "text/plain")}
    )
    assert res_verify.status_code == 200
    v_data = res_verify.json()
    assert v_data["is_valid"] is True
    assert v_data["status"] == "VALID"
    assert v_data["computed_hash"] == v_data["stored_hash"]
    print(" PASS: Identity verified! Stored and computed hashes match 100%.")

    # TEST CASE 3: Detect a modified document using its hash
    print("\n[TEST 3] Testing detection of a modified / tampered document...")
    tampered_bytes = sample_content + b" [FORGED SIGNATURE ATTEMPT]"
    res_tamper = client.post(
        "/api/verify",
        data={"identity_id": test_id},
        files={"document": ("john_card.txt", io.BytesIO(tampered_bytes), "text/plain")}
    )
    assert res_tamper.status_code == 200
    t_data = res_tamper.json()
    assert t_data["is_valid"] is False
    assert t_data["is_tampered"] is True
    assert t_data["status"] == "TAMPERED"
    assert t_data["computed_hash"] != t_data["stored_hash"]
    print(" PASS: Tamper detected! Red alert triggered; mismatch flagged immediately.")

    # TEST CASE 4: Reject an unknown identity ID
    print("\n[TEST 4] Testing rejection of unknown identity ID...")
    res_unknown = client.post(
        "/api/verify",
        data={"identity_id": "NON-EXISTENT-ID-9999"},
        files={"document": ("random.txt", io.BytesIO(b"some document"), "text/plain")}
    )
    assert res_unknown.status_code == 200
    u_data = res_unknown.json()
    assert u_data["is_valid"] is False
    assert u_data["is_not_found"] is True
    assert u_data["status"] == "NOT_FOUND"
    print(" PASS: Unknown identity ID correctly rejected with 'NOT_FOUND' status.")

    # TEST CASE 7: Blockchain Cryptographic Proof & Integrity
    print("\n[TEST 7] Testing blockchain ledger proof of work & link integrity...")
    is_valid, reason = simulated_blockchain.is_chain_valid()
    assert is_valid is True, f"Blockchain corrupted: {reason}"
    summary = simulated_blockchain.get_summary()
    print(f" PASS: Chain valid! Height: {summary['chain_length']} blocks. Zero tampering. Consensus: {summary['consensus']}")

    # TEST CASE 8: Verification History endpoint
    print("\n[TEST 8] Checking verification history table...")
    res_history = client.get("/api/history")
    assert res_history.status_code == 200
    hist = res_history.json()
    assert len(hist) >= 3
    print(f" PASS: History endpoint returned {len(hist)} audit log records.")

    print("\n" + "=" * 60)
    print(" ALL 8 TEST CASES PASSED SUCCESSFULLY (100% GREEN)")
    print("=" * 60)

if __name__ == "__main__":
    run_all_tests()
