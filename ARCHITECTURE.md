# Architecture

## Big picture

```
                    ┌──────────────────────────────┐
                    │ user runs:                   │
                    │ agent-reputation verify      │
                    │   --file attestation.json    │
                    └────────────┬─────────────────┘
                                 │
                                 ▼
              ┌──────────────────────────────────────┐
              │   CLI (src/cli.mjs)                  │
              │                                      │
              │   ┌──────────────────────────────┐   │
              │   │  validateAttestation()       │   │
              │   │  src/schema/attestation.mjs  │   │
              │   └──────────────┬───────────────┘   │
              │                  │                   │
              │   ┌──────────────▼───────────────┐   │
              │   │  verifyAttestation()         │   │
              │   │  src/signature.mjs           │   │
              │   │  • decode embedded pubkey    │   │
              │   │  • canonicalize payload      │   │
              │   │  • Ed25519 verify            │   │
              │   └──────────────────────────────┘   │
              └──────────────────────────────────────┘
                                 │
                                 ▼
                      true (verified) / false (FAIL)
```

## Module map

| File                         | Responsibility                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/cli.mjs`                | argv parsing, subcommand dispatch (keygen/attest/verify/validate), I/O                                   |
| `src/schema/attestation.mjs` | Zod schema                                                                                               |
| `src/keys.mjs`               | Ed25519 keypair generation + base64 raw 32-byte serdes (ASN.1 PKCS8/SPKI prefix dance)                   |
| `src/signature.mjs`          | `canonicalize()`, `signAttestation()`, `verifyAttestation()` — deep-canonical JSON + Ed25519 sign/verify |
| `src/audit.mjs`              | Outbound-fetch audit wrapper (verbatim from sibling projects)                                            |
| `benchmark/run.mjs`          | 30-sample fidelity harness                                                                               |
| `benchmark/score.mjs`        | Per-sample scorer                                                                                        |

## Key encoding

Ed25519 keys are stored as base64-encoded raw 32 bytes (not PEM, not JWK). Node's `crypto` exports keys in PKCS8/SPKI ASN.1 envelopes; `src/keys.mjs` strips those for serialization and re-wraps with fixed prefixes for deserialization. Same encoding as `did:key:z6Mk...` (without multibase prefix).

## Self-contained verification

Each attestation embeds the attestor's public key. The `verify` command needs **only the attestation** — no separate keypair, manifest, or secret. Any party can verify any attestation without coordinating with the signer. This is what makes the protocol genuinely vendor-neutral.

## Determinism

Ed25519 is deterministic by spec (RFC 8032). Combined with canonical-JSON serialization, signing the same attestation twice yields the same signature byte-for-byte. Three benchmark runs produce byte-identical output.

## Privacy at runtime

Zero outbound HTTP calls. Audit-fetch wrapper verbatim from sibling projects guards against future regressions. Benchmark runner asserts no `internal: false` entries in the audit log.

## Trust model

The spec doesn't bootstrap trust — it lets you VERIFY claims, not DECIDE which attestors to TRUST. A verifier learns about attestors out-of-band. Once you know the right public key, you can verify any claim.

## Why not JWT / VC / OpenBadges?

- JWT has the algorithm-confusion attack surface; we put the algorithm in the spec, not the payload.
- VC is heavier (DIDs, contexts, proof types).
- OpenBadges is built for human credentials.

Smaller surface, fewer footguns.

## Threat model (alpha)

- **In scope:** preventing tampering of attestations after signing. Ed25519 signature + canonical JSON guard against modification.
- **In scope:** preventing impersonation. If the verifier has the wrong public key for an attestor, verification fails.
- **Out of scope:** preventing the attestor from lying.
- **Out of scope:** replay protection. v0.2 candidate.
- **Out of scope:** revocation. v0.2 candidate.
