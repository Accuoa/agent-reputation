# agent-reputation

> **Vendor-neutral attestation format for agent reputation.** Any agent can attest to another's competence; anyone can verify the attestation cryptographically. Ed25519 signatures, no shared secrets.

[![alpha demo](https://img.shields.io/badge/status-alpha%20demo-orange)](https://accuoa.github.io/agent-reputation/)

## Headline numbers

On a 30-sample benchmark (15 happy + 10 edge + 5 malformed):

- **100% attestation verification fidelity** (signed attestations verify; malformed inputs error cleanly)
- **0 external network calls** (verified by audit log)
- **Three byte-identical runs** (Ed25519 + deep-canonical JSON → deterministic)

Reproduce: `npm install && npm run benchmark`. Methodology in [`calibration.md`](./calibration.md).

## What this is

- A **vendor-neutral attestation format** ([`SPEC.md`](./SPEC.md)) — JSON shape + Ed25519 signature scheme
- A **reference Node CLI** — generate keypairs, sign attestations, verify attestations (self-contained, no shared secrets needed)

## The problem

A2A (Google's Agent-to-Agent protocol, AGNTCY's framing) defines how agents communicate. It does NOT define how they come to trust each other. Today every framework has its own ad-hoc reputation model, or none.

## Quickstart

```bash
git clone https://github.com/Accuoa/agent-reputation.git
cd agent-reputation
npm install

# Generate an Ed25519 keypair
node src/cli.mjs keygen --out my-keypair.json

# Attest about another agent
node src/cli.mjs attest \
  --keys my-keypair.json \
  --attestor-id 'did:web:me' \
  --subject 'did:web:other' \
  --task 'summarization' \
  --outcome success \
  --confidence 0.9 \
  --out attestation.json

# Anyone with the attestation can verify it — no separate keys needed
node src/cli.mjs verify --file attestation.json
```

## What's in the box

- **CLI** with `keygen`, `attest`, `verify`, `validate`
- **Spec** ([`SPEC.md`](./SPEC.md)) — attestation format + Ed25519 signing rules
- **Zod schema** for the attestation format
- **Self-contained verification** — attestations embed the attestor's public key
- **30-sample benchmark**

## Status

`alpha demo` — keygen, attest, verify, validate all work. Multi-attestation aggregation, reputation scoring, RSA/ECDSA support, DID-key integration, replay protection are all ROADMAP items gated by signal.

## License

MIT — see [LICENSE](./LICENSE).
