#!/usr/bin/env bash
# Full attestation cycle: keygen → attest → verify.
#
# Usage: ./examples/full-cycle.sh

set -euo pipefail

CLI="$(dirname "$0")/../src/cli.mjs"
TMP="$(mktemp -d)"

echo "→ Step 1: generate Ed25519 keypair"
node "$CLI" keygen --out "$TMP/keypair.json"

echo ""
echo "→ Step 2: attest about another agent"
node "$CLI" attest \
  --keys "$TMP/keypair.json" \
  --attestor-id 'did:web:demo:reviewer' \
  --subject 'did:web:demo:summarizer' \
  --task 'summarization' \
  --outcome success \
  --confidence 0.9 \
  --out "$TMP/attestation.json"

echo ""
echo "→ Step 3: anyone verifies the attestation (no separate keys needed)"
node "$CLI" verify --file "$TMP/attestation.json"

echo ""
echo "→ Cleanup"
rm -rf "$TMP"
