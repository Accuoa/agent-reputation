# Calibration log

## Runs

### Run 1 (baseline)

- Date: 2026-05-12
- Hardware: Windows 11, native Node 20

```
FIDELITY: total: 30/30 (100.0%) — happy: 15/15, edge: 10/10, malformed: 5/5
NETWORK: external calls: 0
```

### Run 2 / Run 3 (stability)

Identical to Run 1. `diff` confirms three byte-identical runs. The pipeline is pure structural — Ed25519 is deterministic (RFC 8032) and verification has no clock/random component — so determinism is doubly guaranteed (static fixtures + deterministic verify).

## Final headline numbers (used in launch artifacts)

- **Total fidelity: 100% (30/30 samples)**
- **External network calls: 0**

Breakdown:

- Happy-path: 15/15 (100%)
- Edge-case: 10/10 (100%)
- Malformed: 5/5 errored cleanly (100%)

## Acceptance band

**Strong** — 100% fidelity + 0 external network calls.

Headline copy: "100% attestation verification fidelity on 30 samples, zero external calls."

## Methodology notes

- Pipeline: schema validation → Ed25519 signature verification (using public key embedded in attestation)
- 30 hand-built attestations: 15 happy / 10 edge / 5 malformed
- Pre-signed fixtures: Ed25519 is deterministic per RFC 8032, so the runner can re-verify deterministically. Pre-signing keeps the runner simple (no keypair management).
- Audit log truncated at start; final external count = 0 across all runs
- Reproduce: `npm install && npm run benchmark`
