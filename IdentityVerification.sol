// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IdentityVerification
 * @dev Smart contract for registering and verifying digital identity hashes on the blockchain.
 * Personal identifiable information (PII) like names, emails, and full documents are NEVER
 * stored on-chain. Only cryptographic SHA-256 hashes, timestamps, and issuer addresses are recorded.
 */
contract IdentityVerification {
    // Structure representing an on-chain identity record
    struct IdentityRecord {
        string identityId;
        string documentHash; // SHA-256 hash of identity document
        uint256 timestamp;
        address registeredBy;
        bool exists;
    }

    // Mapping from identityId to IdentityRecord
    mapping(string => IdentityRecord) private identities;
    
    // Mapping from documentHash to identityId for reverse lookup
    mapping(string => string) private hashToIdentity;

    // Array of all registered identity IDs for auditing
    string[] private registeredIdentityIds;

    // Events for transparency and UI event listening
    event IdentityRegistered(
        string indexed identityId,
        string documentHash,
        uint256 timestamp,
        address indexed registeredBy
    );

    event IdentityVerified(
        string indexed identityId,
        string documentHash,
        bool isValid,
        uint256 timestamp
    );

    /**
     * @dev Register a new identity record on the blockchain.
     * @param _identityId Unique identifier (e.g. STUDENT-2024-001)
     * @param _documentHash SHA-256 cryptographic hash of identity payload
     */
    function registerIdentity(string memory _identityId, string memory _documentHash) external {
        require(bytes(_identityId).length > 0, "Identity ID cannot be empty");
        require(bytes(_documentHash).length > 0, "Document hash cannot be empty");
        require(!identities[_identityId].exists, "Identity ID already registered");

        identities[_identityId] = IdentityRecord({
            identityId: _identityId,
            documentHash: _documentHash,
            timestamp: block.timestamp,
            registeredBy: msg.sender,
            exists: true
        });

        hashToIdentity[_documentHash] = _identityId;
        registeredIdentityIds.push(_identityId);

        emit IdentityRegistered(_identityId, _documentHash, block.timestamp, msg.sender);
    }

    /**
     * @dev Verify if a given document hash matches the registered identity ID.
     * @param _identityId Unique identifier to verify against
     * @param _documentHash Hash to compare
     * @return isValid True if match, false otherwise
     * @return timestamp The time when identity was registered
     */
    function verifyIdentity(string memory _identityId, string memory _documentHash) external returns (bool isValid, uint256 timestamp) {
        if (!identities[_identityId].exists) {
            emit IdentityVerified(_identityId, _documentHash, false, block.timestamp);
            return (false, 0);
        }

        IdentityRecord memory record = identities[_identityId];
        isValid = (keccak256(bytes(record.documentHash)) == keccak256(bytes(_documentHash)));
        
        emit IdentityVerified(_identityId, _documentHash, isValid, block.timestamp);
        return (isValid, record.timestamp);
    }

    /**
     * @dev Read-only verification function (no gas cost)
     */
    function checkIdentity(string memory _identityId, string memory _documentHash) external view returns (bool isValid, uint256 timestamp, string memory storedHash) {
        if (!identities[_identityId].exists) {
            return (false, 0, "");
        }
        IdentityRecord memory record = identities[_identityId];
        isValid = (keccak256(bytes(record.documentHash)) == keccak256(bytes(_documentHash)));
        return (isValid, record.timestamp, record.documentHash);
    }

    /**
     * @dev Retrieve identity record details by ID
     */
    function getIdentity(string memory _identityId) external view returns (
        string memory identityId,
        string memory documentHash,
        uint256 timestamp,
        address registeredBy,
        bool exists
    ) {
        IdentityRecord memory record = identities[_identityId];
        return (record.identityId, record.documentHash, record.timestamp, record.registeredBy, record.exists);
    }

    /**
     * @dev Get total number of registered identities
     */
    function getTotalIdentities() external view returns (uint256) {
        return registeredIdentityIds.length;
    }
}
