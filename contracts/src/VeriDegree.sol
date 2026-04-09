// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

error VeriDegree__SoulboundTokenNonTransferable();

/**
 * @title VeriDegree
 * @notice A Soulbound NFT (non-transferable) diploma issuance contract.
 *         Diplomas are minted by authorized MINTER_ROLE holders and stored with an IPFS URI.
 *         Tokens cannot be transferred once minted — they are permanently bound to the recipient.
 */
contract VeriDegree is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _nextTokenId;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when a new diploma is minted.
    event DiplomaIssued(
        address indexed recipient,
        uint256 indexed tokenId,
        string uri
    );

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address admin) ERC721("VeriDegree", "VRD") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    // -------------------------------------------------------------------------
    // Soulbound — Task A
    // Override _update to block all transfers except mints (from == address(0))
    // -------------------------------------------------------------------------

    /**
     * @dev Overrides ERC721's internal _update hook (OpenZeppelin v5).
     *      Reverts on any transfer attempt where `from` is NOT the zero address,
     *      effectively making tokens soulbound after initial mint.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = super._update(to, tokenId, auth);

        // Bloquer tous les transferts (from != address(0)) sauf vers l'adresse zero (burn)
        if (from != address(0) && to != address(0)) {
            revert VeriDegree__SoulboundTokenNonTransferable();
        }

        return from;
    }

    // -------------------------------------------------------------------------
    // Mint — Task C
    // -------------------------------------------------------------------------

    /**
     * @notice Mints a new diploma NFT to `to` with the given IPFS URI.
     * @dev Restricted to accounts with MINTER_ROLE.
     * @param to      The recipient wallet address.
     * @param uri     The IPFS URI pointing to the diploma metadata (ipfs://<CID>).
     */
    function mint(
        address to,
        string calldata uri
    ) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = _nextTokenId;
        unchecked {
            _nextTokenId++;
        }

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit DiplomaIssued(to, tokenId, uri);
    }

    // -------------------------------------------------------------------------
    // View helpers
    // -------------------------------------------------------------------------

    /// @notice Returns the total number of diplomas ever minted.
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    // -------------------------------------------------------------------------
    // Interface overrides required by Solidity
    // -------------------------------------------------------------------------

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
