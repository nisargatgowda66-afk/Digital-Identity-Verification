import hashlib
import json
import time
from typing import List, Dict, Any, Optional, Tuple

class Block:
    def __init__(
        self,
        index: int,
        timestamp: float,
        transactions: List[Dict[str, Any]],
        previous_hash: str,
        nonce: int = 0,
        block_hash: str = ""
    ):
        self.index = index
        self.timestamp = timestamp
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.merkle_root = self.calculate_merkle_root()
        self.hash = block_hash if block_hash else self.compute_hash()

    def calculate_merkle_root(self) -> str:
        """Calculate Merkle root hash for all transactions in this block."""
        if not self.transactions:
            return hashlib.sha256(b"empty_block").hexdigest()
        
        tx_hashes = [
            tx.get("tx_hash", hashlib.sha256(json.dumps(tx, sort_keys=True).encode()).hexdigest())
            for tx in self.transactions
        ]
        
        while len(tx_hashes) > 1:
            if len(tx_hashes) % 2 != 0:
                tx_hashes.append(tx_hashes[-1])
            new_level = []
            for i in range(0, len(tx_hashes), 2):
                combined = tx_hashes[i] + tx_hashes[i+1]
                new_level.append(hashlib.sha256(combined.encode()).hexdigest())
            tx_hashes = new_level
            
        return tx_hashes[0]

    def compute_hash(self) -> str:
        """Compute SHA-256 hash of the block header and content."""
        payload = {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": self.transactions,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
            "merkle_root": self.merkle_root
        }
        raw_string = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(raw_string.encode()).hexdigest()

    def mine_block(self, difficulty: int = 2) -> None:
        """Proof-of-work algorithm to find valid block hash with leading zeros."""
        target = "0" * difficulty
        while not self.hash.startswith(target):
            self.nonce += 1
            self.hash = self.compute_hash()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "formatted_time": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(self.timestamp)),
            "transactions": self.transactions,
            "transaction_count": len(self.transactions),
            "previous_hash": self.previous_hash,
            "merkle_root": self.merkle_root,
            "nonce": self.nonce,
            "hash": self.hash,
        }

class SimulatedBlockchain:
    """
    In-memory cryptographic blockchain ledger for student projects.
    Maintains full chain integrity, SHA-256 block hashing, Proof of Work mining,
    Merkle roots, and immutable state trie mapping identity IDs to cryptographic hashes.
    """
    def __init__(self, difficulty: int = 2):
        self.difficulty = difficulty
        self.chain: List[Block] = []
        self.pending_transactions: List[Dict[str, Any]] = []
        # State ledger mapping identity_id -> latest on-chain record
        self.state: Dict[str, Dict[str, Any]] = {}
        self.create_genesis_block()

    def create_genesis_block(self) -> None:
        """Initialize the blockchain with a cryptographically valid Genesis Block."""
        genesis_tx = {
            "tx_hash": hashlib.sha256(b"GENESIS_TX_DIGITAL_IDENTITY").hexdigest(),
            "action": "GENESIS",
            "identity_id": "SYSTEM_GENESIS",
            "document_hash": hashlib.sha256(b"GENESIS_BLOCK_DATA").hexdigest(),
            "timestamp": time.time(),
            "issuer": "0x0000000000000000000000000000000000000000",
            "metadata": "Genesis block for Decentralized Identity System"
        }
        genesis_block = Block(
            index=0,
            timestamp=time.time(),
            transactions=[genesis_tx],
            previous_hash="0" * 64,
            nonce=0
        )
        genesis_block.mine_block(self.difficulty)
        self.chain.append(genesis_block)

    @property
    def latest_block(self) -> Block:
        return self.chain[-1]

    def register_identity(
        self,
        identity_id: str,
        document_hash: str,
        issuer: str = "0x71C...LocalAuthority"
    ) -> Dict[str, Any]:
        """
        Record an identity hash onto the blockchain.
        Mines a new block and updates the immutable state.
        """
        timestamp = time.time()
        tx_data = f"{identity_id}:{document_hash}:{timestamp}:{issuer}"
        tx_hash = "0x" + hashlib.sha256(tx_data.encode()).hexdigest()

        transaction = {
            "tx_hash": tx_hash,
            "action": "REGISTER_IDENTITY",
            "identity_id": identity_id,
            "document_hash": document_hash,
            "timestamp": timestamp,
            "formatted_time": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp)),
            "issuer": issuer,
        }

        # Create new block for this transaction
        new_block = Block(
            index=len(self.chain),
            timestamp=timestamp,
            transactions=[transaction],
            previous_hash=self.latest_block.hash
        )
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)

        # Update state mapping
        self.state[identity_id] = {
            "identity_id": identity_id,
            "document_hash": document_hash,
            "registered_at": timestamp,
            "block_index": new_block.index,
            "tx_hash": tx_hash,
            "block_hash": new_block.hash
        }

        return {
            "tx_hash": tx_hash,
            "block_number": new_block.index,
            "block_hash": new_block.hash,
            "timestamp": timestamp,
            "status": "CONFIRMED_ON_CHAIN",
            "blockchain_mode": "SIMULATED_LEDGER"
        }

    def verify_identity(self, identity_id: str, document_hash: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """
        Check if an identity exists on chain and whether the provided document hash matches.
        Logs an audit verification transaction into the ledger.
        """
        timestamp = time.time()
        record = self.state.get(identity_id)

        if not record:
            return False, None, "Identity ID not registered on blockchain."

        stored_hash = record["document_hash"]
        is_match = (stored_hash.lower() == document_hash.lower())

        # Record verification event on chain as a lightweight audit block
        audit_tx = {
            "tx_hash": "0x" + hashlib.sha256(f"AUDIT:{identity_id}:{document_hash}:{timestamp}:{is_match}".encode()).hexdigest(),
            "action": "VERIFY_IDENTITY",
            "identity_id": identity_id,
            "provided_hash": document_hash,
            "match_result": is_match,
            "timestamp": timestamp,
            "formatted_time": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp)),
        }

        audit_block = Block(
            index=len(self.chain),
            timestamp=timestamp,
            transactions=[audit_tx],
            previous_hash=self.latest_block.hash
        )
        audit_block.mine_block(self.difficulty)
        self.chain.append(audit_block)

        if is_match:
            return True, record, "Identity verified successfully. Document hash matches blockchain record exactly."
        else:
            return False, record, "TAMPER DETECTED: Computed document hash does NOT match the cryptographic hash stored on the blockchain."

    def get_identity(self, identity_id: str) -> Optional[Dict[str, Any]]:
        return self.state.get(identity_id)

    def is_chain_valid(self) -> Tuple[bool, str]:
        """
        Verify the entire blockchain's cryptographic integrity from Genesis to tip.
        """
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            prev = self.chain[i - 1]

            if current.previous_hash != prev.hash:
                return False, f"Broken chain link at Block #{current.index}: Previous hash does not match Block #{prev.index} hash."

            if current.hash != current.compute_hash():
                return False, f"Tampered Block data detected at Block #{current.index}: Stored hash does not match recomputed SHA-256."

            target = "0" * self.difficulty
            if not current.hash.startswith(target):
                return False, f"Block #{current.index} fails Proof-of-Work difficulty requirement ({target})."

        return True, "Blockchain cryptographic integrity 100% verified. Zero tampering detected."

    def get_summary(self) -> Dict[str, Any]:
        is_valid, validation_msg = self.is_chain_valid()
        total_txs = sum(len(b.transactions) for b in self.chain)
        return {
            "chain_length": len(self.chain),
            "total_transactions": total_txs,
            "latest_block_number": self.latest_block.index,
            "latest_block_hash": self.latest_block.hash,
            "difficulty": self.difficulty,
            "is_valid": is_valid,
            "validation_status": validation_msg,
            "total_identities_stored": len(self.state),
            "consensus": "Proof of Work (SHA-256)"
        }

    def get_all_blocks(self) -> List[Dict[str, Any]]:
        return [b.to_dict() for b in reversed(self.chain)]
