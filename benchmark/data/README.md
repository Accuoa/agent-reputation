# Benchmark dataset

30 hand-built attestations testing schema validation + Ed25519 signature verification.

## Files

- `samples.jsonl` — one bundle per line. Each bundle is `{attestation: {...}}` for happy/edge, or `{__raw__: "<string>", __malformed__: true}` for malformed JSON.
- `expected.jsonl` — paired expected outcomes. Either `{verified: true}` or `{expected_error: "<regex>"}`.

## Composition

- **15 happy-path** (lines 1–15): valid attestations with correct signatures. Vary outcomes (success/failure), confidences (0.1, 0.5, 0.9), task classes, attestor/subject ID formats (DID, URL, plain string), three different attestor keypairs.
- **10 edge-case** (lines 16–25): confidence 0.0 with success, confidence 1.0 with failure, very long task_class, unicode in IDs, catchall fields on attestor/subject, consensus pair (same subject, two attestors), minimum-length task_class, high-precision confidence (0.123456789), and a couple more.
- **5 malformed** (lines 26–30):
  - tampered signature
  - wrong format literal
  - confidence out of range (1.5)
  - completely invalid JSON
  - signature swapped from a different attestation (replay)

## License

MIT.

## Generation

Samples are pre-signed using fixed keypairs generated at dataset creation time. The keypairs are NOT committed (each attestation embeds its attestor's public key, which is sufficient for verification).
