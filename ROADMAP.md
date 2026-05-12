# Roadmap

## Done — v0.1 alpha

- Vendor-neutral attestation format spec
- CLI with `keygen`, `attest`, `verify`, `validate` subcommands
- Zod schema
- Self-contained verification — verifier needs only the attestation
- Deterministic Ed25519 signatures (RFC 8032)
- Deep-canonical JSON serialization
- 30-sample fidelity benchmark
- Audit-fetch wrapper for runtime privacy claims

## In flight

- Validation period: 30-day signal-collection window per the [portfolio strategy](https://github.com/Accuoa). v0.2 scope depends on alpha signal.

## Planned (v0.2 candidates — gated by alpha signal)

- **Aggregation spec** — combining N attestations about same subject into a reputation score.
- **Multiple signature algorithms** — RSA, ECDSA (P-256, secp256k1).
- **DID:key integration** — formally embed public key as `did:key:z...` URI.
- **Replay protection** — `nonce` field + verifier-side nonce tracking.
- **Negative attestations + revocation** — explicit revocation messages.
- **Standardized task class taxonomy** — vocabulary of common agent capabilities.
- **A2A wire format binding** — define how attestations attach to A2A messages.
- **Reference impls** in Python / Go.

## Out of scope (probably never)

- Hosted reputation service. Protocol, not SaaS.
- Identity issuance.
- LLM-based truth verification.
