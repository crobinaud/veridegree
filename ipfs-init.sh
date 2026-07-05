#!/bin/sh
set -e

echo "Configuring CORS for IPFS..."
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
echo "CORS configured successfully."
