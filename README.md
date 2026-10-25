# Digital Identity Verification Using Blockchain

A full-stack decentralized digital identity verification platform built with **FastAPI**, **SQLite**, **React 19 + Vite**, **SHA-256 Cryptographic Hashing**, a **Built-in Proof-of-Work Blockchain Ledger**, and optional **Ethereum EVM Smart Contracts (Ganache / Solidity)**.

---

## 🌟 Key Features

1. **Zero-PII On-Chain Storage**:
   - Personal Identifiable Information (names, emails, full document files) is **never** stored on the public blockchain.
   - Only irreversible **256-bit SHA-256 cryptographic hashes**, timestamps, and transaction receipts are anchored to the immutable ledger.

2. **Dual-Mode Blockchain Architecture**:
   - **Simulated Cryptographic PoW Ledger (Default)**: Zero-dependency, in-memory blockchain with SHA-256 block hashing, Proof-of-Work mining, Merkle roots, and chain link integrity validation (`is_chain_valid`).
   - **Ethereum Ganache EVM**: Ready-to-deploy Solidity smart contract (`contracts/IdentityVerification.sol`) with pre-compiled ABI & bytecode (`contracts/compiled_contract.json`).

3. **Instant Tamper Detection (Avalanche Effect)**:
   - Modifying even a single character, space, or byte in an identity credential alters the entire SHA-256 digest, triggering an immediate **TAMPER ALERT** on the frontend and on the blockchain.

4. **Rich Interactive Web Interface**:
   - **Verify Tab**: Drag-and-drop document audit with client-side SHA-256 pre-calculation and side-by-side hash comparison.
   - **Register Tab**: Step-by-step mining visualizer and block confirmation receipt.
   - **Blockchain Explorer**: Live block pipeline showing block indices, hashes, previous hashes, Merkle roots, and nonces. Includes a 1-click "Re-Audit Chain Integrity" button.
   - **Identities Registry**: Searchable catalog of registered identities with 1-click "Verify Now" shortcuts.
   - **Audit History**: Chronological timeline of all authentic and tampered verification attempts.
   - **Smart Contract & Node Panel**: Ganache EVM connection status, mode toggler (AUTO, SIMULATED, GANACHE), and 1-click contract deployer.

---

## 🚀 How to Run the Project

### Prerequisites
- Python 3.10+ (Verified on Python 3.11)
- Node.js 18+ (Verified on Node.js v20+)

---

### Step 1: Start the Backend API Server
Open a terminal in the project directory:

```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

> **Backend URL**: `http://127.0.0.1:8000`  
> **Interactive Swagger API Docs**: `http://127.0.0.1:8000/docs`

---

### Step 2: Start the Frontend Application
Open a second terminal:

```bash
cd frontend
npm run dev
```

> **Frontend Web App**: `http://localhost:5173`

---

### Step 3 (Optional): Run the Automated Test Suite
To verify all 8 cryptographic, blockchain, and API test cases:

```bash
cd backend
python test_system.py
```

Expected output:
```text
============================================================
RUNNING AUTOMATED TEST SUITE FOR BLOCKCHAIN IDENTITY SYSTEM
============================================================
[TEST 6] Testing SHA-256 hash determinism... PASS
[TEST 3a] Testing cryptographic sensitivity... PASS
[TEST 5] Testing empty and invalid input handling... PASS
[TEST 1] Testing successful identity registration... PASS
[TEST 2] Testing successful verification with matching document... PASS
[TEST 3] Testing detection of a modified / tampered document... PASS
[TEST 4] Testing rejection of unknown identity ID... PASS
[TEST 7] Testing blockchain ledger proof of work & link integrity... PASS
[TEST 8] Checking verification history table... PASS
============================================================
 ALL 8 TEST CASES PASSED SUCCESSFULLY (100% GREEN)
============================================================
```

---

## 🧪 Step-by-Step Testing & Demonstration Guide

### 1. Instant Demo Seeding
1. Open the frontend in your browser at `http://localhost:5173`.
2. Click the **"Seed Demo Data"** button in the top navigation bar.
3. This automatically populates 3 fictional identities on-chain:
   - `STU-2024-8841` - **Aarav Sharma** (Student ID Card)
   - `PASSPORT-IN-90412` - **Priya Patel** (Passport)
   - `EMP-DL-4410` - **Rohan Verma** (Driver's License)
4. It also automatically generates both **valid** and **tampered** sample document files in `backend/uploads/`.

### 2. Testing Authentic Verification (Green Match Confirmed)
1. On the **Verify Identity** tab, click the **"STU-2024-8841"** chip to auto-fill the Identity ID.
2. Click **"Valid Doc"** to download `aarav_student_id.txt`.
3. Drag & drop or select `aarav_student_id.txt` into the upload zone.
4. Observe the **Computed SHA-256** preview hash.
5. Click **"Audit Document On Blockchain"**.
6. **Result**: A glowing green **"100% CRYPTOGRAPHIC MATCH"** card appears with the registered Block number, transaction hash, and timestamp.

### 3. Testing Tamper Detection (Red Tamper Alert)
1. In the same identity (`STU-2024-8841`), click **"Tampered Doc"** to download `tampered_aarav_student_id.txt` (or open the original file and modify just one letter).
2. Drag & drop or upload the modified file.
3. Click **"Audit Document On Blockchain"**.
4. **Result**: A glowing red **"TAMPER ALERT DETECTED"** card appears showing the hash discrepancy between the computed document hash and the immutable blockchain record.

### 4. Testing Identity Registration
1. Switch to the **"Register Identity"** tab.
2. Enter a unique ID (e.g. `STU-2026-0099`), Holder Name, Email, and Document Type.
3. Upload any file (`.txt`, `.pdf`, `.png`, etc.).
4. Click **"Commit Identity Hash To Blockchain"**.
5. Watch the 3-step mining animation:
   - Step 1: Hashing Document (SHA-256)
   - Step 2: Proof-of-Work Mining
   - Step 3: Block Confirmed & State Stored.
6. Click **"Test Verify Now"** to verify your newly registered credential immediately.

### 5. Inspecting the Blockchain Explorer
1. Click **"Blockchain Explorer"** in the navigation bar.
2. View the chronological chain from **Genesis Block #0** up to the latest block.
3. Expand any block to inspect:
   - Block SHA-256 Hash
   - Previous Block Hash
   - Merkle Root
   - Proof-of-Work Nonce
   - Transactions inside the block
4. Click **"Re-Audit Chain Integrity"** to trigger a real-time cryptographic audit across all blocks.

---

## 📁 Project Structure

```text
Block Chain/
├── backend/
│   ├── blockchain.py          # Simulated PoW Cryptographic Blockchain Ledger
│   ├── contract_manager.py    # Web3 / Ganache EVM smart contract manager
│   ├── database.py            # SQLite database models (IdentityRecord, VerificationLog)
│   ├── main.py                # FastAPI REST API endpoints
│   ├── test_system.py         # Automated test suite (8 test cases)
│   ├── requirements.txt       # Python dependencies
│   └── uploads/               # Sample files & uploaded documents
├── contracts/
│   ├── IdentityVerification.sol # Solidity smart contract
│   └── compiled_contract.json   # Contract ABI & Bytecode
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Header & mode status badge
│   │   │   ├── QuickStats.jsx   # Live on-chain KPI cards
│   │   │   ├── VerifyTab.jsx    # Identity verification interface & hash diff
│   │   │   ├── RegisterTab.jsx  # Registration form & mining visualizer
│   │   │   ├── ExplorerTab.jsx  # Blockchain explorer & integrity validator
│   │   │   ├── IdentitiesTab.jsx# Filterable registry of on-chain IDs
│   │   │   ├── HistoryTab.jsx   # Chronological audit logs
│   │   │   └── ContractTab.jsx  # Ganache EVM & Solidity settings
│   │   ├── api.js               # API service & client SHA-256 computation
│   │   ├── App.jsx              # Main React application
│   │   ├── index.css            # Tailwind CSS v4 & custom glassmorphism styles
│   │   └── main.jsx             # React entry point
│   ├── package.json
│   └── vite.config.js
├── .env                       # Environment configuration
└── README.md                  # Complete documentation
```
