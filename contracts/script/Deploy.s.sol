// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/VeriDegree.sol";

/**
 * @title Deploy
 * @notice Deployment script for VeriDegree.
 *
 * Usage — Anvil (local dev):
 *   forge script script/Deploy.s.sol \
 *     --rpc-url http://127.0.0.1:8545 \
 *     --broadcast \
 *     --private-key <ANVIL_PRIVATE_KEY>
 *
 * Usage — Besu QBFT (production):
 *   forge script script/Deploy.s.sol \
 *     --rpc-url <BESU_NODE_IP>:<PORT> \
 *     --broadcast \
 *     --private-key <BESU_PRIVATE_KEY> \
 *     --legacy
 */
contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        // The deployer becomes the admin and initial MINTER_ROLE holder
        address deployer = msg.sender;
        VeriDegree veriDegree = new VeriDegree(deployer);

        vm.stopBroadcast();

        // Log useful deployment info
        console.log("=== VeriDegree Deployment ===");
        console.log("Contract address :", address(veriDegree));
        console.log("Admin / Minter   :", deployer);
        console.log("Network chain ID :", block.chainid);
    }
}
