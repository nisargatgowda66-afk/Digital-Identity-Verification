import os
import json
from typing import Dict, Any, Optional, Tuple
from web3 import Web3

CONTRACT_ARTIFACT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "contracts", "compiled_contract.json"))
DEPLOYED_CONFIG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "deployed_contract.json"))

class GanacheContractManager:
    """
    Manages Web3 connection to local Ganache/Anvil/Hardhat Ethereum nodes,
    handles smart contract deployment, and executes on-chain transactions.
    """
    def __init__(self, rpc_urls: list = None):
        if rpc_urls is None:
            rpc_urls = ["http://127.0.0.1:8545", "http://127.0.0.1:7545", "http://localhost:8545"]
        self.rpc_urls = rpc_urls
        self.w3: Optional[Web3] = None
        self.active_rpc: Optional[str] = None
        self.contract = None
        self.contract_address: Optional[str] = None
        self.abi = []
        self.bytecode = ""
        
        self._load_artifacts()
        self._load_deployed_config()
        self.reconnect()

    def _load_artifacts(self):
        if os.path.exists(CONTRACT_ARTIFACT_PATH):
            try:
                with open(CONTRACT_ARTIFACT_PATH, "r") as f:
                    data = json.load(f)
                    self.abi = data.get("abi", [])
                    self.bytecode = data.get("bin", "")
            except Exception as e:
                print(f"[ContractManager] Error loading artifact: {e}")

    def _load_deployed_config(self):
        if os.path.exists(DEPLOYED_CONFIG_PATH):
            try:
                with open(DEPLOYED_CONFIG_PATH, "r") as f:
                    cfg = json.load(f)
                    self.contract_address = cfg.get("contract_address")
            except Exception as e:
                print(f"[ContractManager] Error loading deployed config: {e}")

    def _save_deployed_config(self, address: str):
        self.contract_address = address
        try:
            with open(DEPLOYED_CONFIG_PATH, "w") as f:
                json.dump({"contract_address": address}, f, indent=2)
        except Exception as e:
            print(f"[ContractManager] Error saving deployed config: {e}")

    def reconnect(self) -> bool:
        """Attempt fast connection to configured RPC URLs."""
        for url in self.rpc_urls:
            try:
                provider = Web3.HTTPProvider(url, request_kwargs={'timeout': 0.3})
                w3_candidate = Web3(provider)
                if w3_candidate.is_connected():
                    self.w3 = w3_candidate
                    self.active_rpc = url
                    self._init_contract_instance()
                    return True
            except Exception:
                continue
        self.w3 = None
        self.active_rpc = None
        return False

    def _init_contract_instance(self):
        if self.w3 and self.contract_address and self.abi:
            try:
                checksummed = self.w3.to_checksum_address(self.contract_address)
                self.contract = self.w3.eth.contract(address=checksummed, abi=self.abi)
            except Exception as e:
                print(f"[ContractManager] Error instantiating contract: {e}")
                self.contract = None

    def get_status(self) -> Dict[str, Any]:
        is_connected = self.reconnect() if (not self.w3 or not self.w3.is_connected()) else True
        if not is_connected:
            return {
                "connected": False,
                "rpc_url": None,
                "network_id": None,
                "block_number": None,
                "accounts_count": 0,
                "default_account": None,
                "contract_deployed": False,
                "contract_address": self.contract_address,
                "status_message": "Local Ganache EVM node not detected on ports 8545/7545. System is using the built-in Cryptographic Blockchain Ledger."
            }

        try:
            accounts = self.w3.eth.accounts
            block_number = self.w3.eth.block_number
            net_id = self.w3.eth.chain_id
            primary_account = accounts[0] if accounts else None
            
            return {
                "connected": True,
                "rpc_url": self.active_rpc,
                "network_id": net_id,
                "block_number": block_number,
                "accounts_count": len(accounts),
                "default_account": primary_account,
                "contract_deployed": self.contract is not None,
                "contract_address": self.contract_address,
                "status_message": f"Connected to Ganache EVM at {self.active_rpc}. Ready for smart contract transactions."
            }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e),
                "status_message": f"Ganache connection error: {str(e)}"
            }

    def deploy_contract(self) -> Dict[str, Any]:
        """Deploy IdentityVerification.sol to the running Ganache node."""
        if not self.w3 or not self.w3.is_connected():
            return {"success": False, "error": "Cannot deploy: Ganache node is not connected."}

        if not self.abi or not self.bytecode:
            return {"success": False, "error": "Contract ABI or Bytecode missing. Please compile IdentityVerification.sol first."}

        try:
            accounts = self.w3.eth.accounts
            if not accounts:
                return {"success": False, "error": "No unlocked Ethereum accounts found in Ganache."}

            deployer = accounts[0]
            ContractFactory = self.w3.eth.contract(abi=self.abi, bytecode=self.bytecode)
            tx_hash = ContractFactory.constructor().transact({"from": deployer})
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

            contract_address = tx_receipt.contractAddress
            self._save_deployed_config(contract_address)
            self._init_contract_instance()

            return {
                "success": True,
                "contract_address": contract_address,
                "tx_hash": tx_receipt.transactionHash.hex(),
                "block_number": tx_receipt.blockNumber,
                "gas_used": tx_receipt.gasUsed,
                "deployer": deployer
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def register_identity(self, identity_id: str, document_hash: str) -> Dict[str, Any]:
        """Call registerIdentity on the Solidity smart contract."""
        if not self.contract or not self.w3:
            raise RuntimeError("Smart contract not connected or not deployed on Ganache.")

        accounts = self.w3.eth.accounts
        sender = accounts[0]

        tx_hash = self.contract.functions.registerIdentity(identity_id, document_hash).transact({
            "from": sender
        })
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

        return {
            "tx_hash": receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber,
            "gas_used": receipt.gasUsed,
            "sender": sender,
            "status": "CONFIRMED_ON_GANACHE",
            "blockchain_mode": "ETHEREUM_GANACHE"
        }

    def verify_identity(self, identity_id: str, document_hash: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """Call checkIdentity/verifyIdentity on the Solidity smart contract."""
        if not self.contract or not self.w3:
            raise RuntimeError("Smart contract not connected or not deployed on Ganache.")

        # Call read-only checkIdentity
        is_valid, timestamp, stored_hash = self.contract.functions.checkIdentity(identity_id, document_hash).call()

        if not stored_hash:
            return False, None, "Identity ID not found on Ethereum smart contract."

        record = {
            "identity_id": identity_id,
            "document_hash": stored_hash,
            "registered_at": timestamp,
            "blockchain_mode": "ETHEREUM_GANACHE"
        }

        if is_valid:
            msg = "Identity successfully verified on Ethereum smart contract! Document hash matches exactly."
        else:
            msg = "TAMPER DETECTED: Computed document hash does not match the smart contract record."

        return is_valid, record, msg
