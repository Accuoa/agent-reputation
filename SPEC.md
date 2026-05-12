# agent-reputation — Vendor-Neutral Attestation Format

**Status:** Draft v0.1
**License:** MIT
**Reference implementation:** [`src/`](./src/) in this repo

This document defines a vendor-neutral attestation format for agent reputation. An attestor agent signs a claim about a subject agent's competence at a task class. Any third party with only the attestation file can verify the claim cryptographically.

## Goals

- Vendor-neutral attestation format applicable across A2A frameworks
- Public-key crypto so verification doesn't require pre-shared secrets
- Self-contained: each attestation embeds the attestor's public key
- Deterministic signing (Ed25519, RFC 8032)
- Implementable with stdlib in any language

## Non-goals (v0.1)

- Aggregation across multiple attestations (v0.2 candidate)
- Reputation scoring (v0.2 candidate)
- Multiple signature algorithms (v0.2 candidate — only Ed25519 in v0.1)
- Revocation, key rotation, replay protection (v0.2 candidates)
- Identity resolution (agent IDs are opaque strings)
- Attestation transport (out of scope — this is a format spec, not a transport)

## Attestation format

```jsonc
{
  "format": "agent-reputation-attestation",
  "version": "0.1",
  "attestor": {
    "id": "did:web:example.com:agent:scribe",
    "public_key": "base64-32-byte-ed25519-public-key",
  },
  "subject": {
    "id": "did:web:other.com:agent:summarizer",
  },
  "task_class": "summarization",
  "outcome": "success",
  "confidence": 0.9,
  "issued_at": "2026-05-12T00:00:00Z",
  "signature": "base64-ed25519-signature",
}
```

### Conformance rules

- `format` MUST equal `"agent-reputation-attestation"`.
- `version` MUST equal `"0.1"`.
- `attestor.id` and `subject.id` are opaque non-empty strings (DID, URL, anything).
- `attestor.public_key` MUST be base64-encoded raw 32-byte Ed25519 public key.
- `task_class` MUST be a non-empty string. Opaque to the spec; domain-specific.
- `outcome` MUST be `"success"` or `"failure"` (no third state in v0.1).
- `confidence` MUST be a number in `[0.0, 1.0]`.
- `issued_at` MUST be a non-empty string. ISO-8601 recommended; format not validated in v0.1.
- `signature` MUST be a non-empty base64 string.
- Catchall fields on `attestor` and `subject` are allowed for forward-compat.

The Zod definition in [`src/schema/attestation.mjs`](./src/schema/attestation.mjs) is canonical.

## Ed25519 key encoding

Keys are stored as **base64-encoded raw 32 bytes**. Not PEM, not JWK.

- Public key: 32 bytes raw → base64 (44 chars with padding).
- Private key: 32 bytes raw (seed) → base64.

This matches what `did:key:z6Mk...` encodes (without multibase prefix), interoperable with DID:key infrastructure.

Standard ASN.1 prefixes for re-wrapping raw bytes:

- SPKI (public): `302a300506032b6570032100`
- PKCS8 (private): `302e020100300506032b657004220420`

Reference: [`src/keys.mjs`](./src/keys.mjs).

## Signature scheme

### Canonicalization

Both signer and verifier serialize the attestation to a canonical string before signing/verifying:

1. **Exclude** the `signature` field from the signed payload.
2. **Deep-sort** all object keys recursively (top-level AND every nested object).
3. **Preserve** array element order.
4. UTF-8 JSON output without extra whitespace.

Reference: [`src/signature.mjs`](./src/signature.mjs).

### Signing

```
payload_bytes = utf8(canonical_json(attestation_without_signature))
signature_bytes = Ed25519_sign(private_key, payload_bytes)   // RFC 8032
signature_base64 = base64(signature_bytes)
```

Ed25519 is deterministic per RFC 8032 — same `(private_key, payload)` always produces the same signature.

### Verification

```
payload_bytes = utf8(canonical_json(attestation_without_signature))
signature_bytes = base64_decode(attestation.signature)
public_key = decode_ed25519(attestation.attestor.public_key)
valid = Ed25519_verify(public_key, payload_bytes, signature_bytes)
```

Verification is fully deterministic.

## Trust model

The spec doesn't bootstrap trust — it lets verifiers CHECK claims, not DECIDE which attestors to trust. A verifier learns about attestors out-of-band (registries, recommendations, DID-resolved web hosting). Once you know which public keys to trust for which agents, you can verify any of their claims about anyone.

## Why not JWT / VC / OpenBadges?

- **JWT**: algorithm-confusion attacks are a known footgun. We put `signature_algo` in the format (not the payload), and the format pins Ed25519 in v0.1.
- **Verifiable Credentials (VC)**: heavy (DIDs, contexts, proof types). Overkill for "A says B is good at X".
- **OpenBadges**: built for human-issued credentials, wrong shape for agent-to-agent.

This spec aims for a minimal primitive that agent frameworks can adopt without buying into a full credential ecosystem.

## Contributing

Want to propose v0.2 (aggregation? RSA? streaming?)? Open an issue.
