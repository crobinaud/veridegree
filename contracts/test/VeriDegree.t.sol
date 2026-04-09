// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/VeriDegree.sol";

/**
 * @title VeriDegreeTest
 * @notice Unit tests for the VeriDegree soulbound NFT contract.
 *
 * Coverage:
 *  1. MINTER_ROLE can mint a token.
 *  2. Non-minter is rejected (reverts).
 *  3. tokenURI matches the IPFS URI passed at mint.
 *  4. Transfers revert (soulbound).
 *  5. Approve + transfer via approved account reverts (soulbound).
 */
contract VeriDegreeTest is Test {
    VeriDegree public vd;

    address internal admin = makeAddr("admin");
    address internal minter = makeAddr("minter");
    address internal student = makeAddr("student");
    address internal hacker = makeAddr("hacker");

    string internal constant IPFS_URI = "ipfs://QmTestCID123456789";

    function setUp() public {
        // Deploy as admin — admin automatically gets DEFAULT_ADMIN_ROLE and MINTER_ROLE
        vm.startPrank(admin);
        vd = new VeriDegree(admin);
        // Grant minter role to the dedicated minter address
        vd.grantRole(vd.MINTER_ROLE(), minter);
        vm.stopPrank();
    }

    // -------------------------------------------------------------------------
    // Test 1 — MINTER_ROLE can mint
    // -------------------------------------------------------------------------

    function test_MinterCanMint() public {
        vm.prank(minter);
        vd.mint(student, IPFS_URI);

        assertEq(vd.ownerOf(0), student);
        assertEq(vd.totalSupply(), 1);
    }

    // -------------------------------------------------------------------------
    // Test 2 — Non-minter is rejected
    // -------------------------------------------------------------------------

    function test_NonMinterCannotMint() public {
        vm.prank(hacker);
        vm.expectRevert();
        vd.mint(student, IPFS_URI);
    }

    // -------------------------------------------------------------------------
    // Test 3 — tokenURI matches the IPFS URI
    // -------------------------------------------------------------------------

    function test_TokenURIMatchesIPFS() public {
        vm.prank(minter);
        vd.mint(student, IPFS_URI);

        assertEq(vd.tokenURI(0), IPFS_URI);
    }

    // -------------------------------------------------------------------------
    // Test 4 — Transfer reverts (soulbound)
    // -------------------------------------------------------------------------

    function test_TransferReverts() public {
        vm.prank(minter);
        vd.mint(student, IPFS_URI);

        vm.prank(student);
        vm.expectRevert(VeriDegree__SoulboundTokenNonTransferable.selector);
        vd.transferFrom(student, hacker, 0);
    }

    function test_SafeTransferReverts() public {
        vm.prank(minter);
        vd.mint(student, IPFS_URI);

        vm.prank(student);
        vm.expectRevert(VeriDegree__SoulboundTokenNonTransferable.selector);
        vd.safeTransferFrom(student, hacker, 0);
    }

    // -------------------------------------------------------------------------
    // Test 5 — Approve + transfer via approved account reverts (soulbound)
    // -------------------------------------------------------------------------

    function test_ApproveAndTransferReverts() public {
        vm.prank(minter);
        vd.mint(student, IPFS_URI);

        // Student approves hacker
        vm.prank(student);
        vd.approve(hacker, 0);

        // Even though approved, the transfer must revert because token is soulbound
        vm.prank(hacker);
        vm.expectRevert(VeriDegree__SoulboundTokenNonTransferable.selector);
        vd.transferFrom(student, hacker, 0);
    }

    // -------------------------------------------------------------------------
    // Extra — token counter increments correctly across multiple mints
    // -------------------------------------------------------------------------

    function test_TokenIdIncrement() public {
        address student2 = makeAddr("student2");

        vm.startPrank(minter);
        vd.mint(student, IPFS_URI);
        vd.mint(student2, "ipfs://QmSecondCID");
        vm.stopPrank();

        assertEq(vd.ownerOf(0), student);
        assertEq(vd.ownerOf(1), student2);
        assertEq(vd.totalSupply(), 2);
    }

    // -------------------------------------------------------------------------
    // Extra — Admin can revoke MINTER_ROLE
    // -------------------------------------------------------------------------

    function test_RevokedMinterCannotMint() public {
        // Evaluate the role before prank so prank isn't consumed by the getter
        bytes32 role = vd.MINTER_ROLE();

        // Revoke minter's role
        vm.prank(admin);
        vd.revokeRole(role, minter);

        // Minter can no longer mint
        vm.prank(minter);
        vm.expectRevert();
        vd.mint(student, IPFS_URI);
    }
}
