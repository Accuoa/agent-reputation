# Usage

## Install

```bash
git clone https://github.com/Accuoa/agent-reputation.git
cd agent-reputation
npm install
```

## CLI

### `keygen`

Generate an Ed25519 keypair.

```bash
node src/cli.mjs keygen --out <keypair.json>
```

Output JSON: `{ "private_key": "<base64-32-bytes>", "public_key": "<base64-32-bytes>" }`. Both keys are raw 32-byte Ed25519 keys, base64-encoded.

### `attest`

Sign an attestation.

```bash
node src/cli.mjs attest \
  --keys <keypair.json> \
  --attestor-id <id> \
  --subject <id> \
  --task <class> \
  --outcome <success|failure> \
  --confidence <0-1> \
  --out <attestation.json>
```

Embeds the keypair's public key in the attestation so any verifier can check it.

### `verify`

Verify a signed attestation. **Self-contained** — uses the public key embedded in the attestation; no separate keys argument.

```bash
node src/cli.mjs verify --file <attestation.json>
```

Exits 0 if signature valid, 1 with error if not.

### `validate`

Check schema only (don't verify signature).

```bash
node src/cli.mjs validate --file <attestation.json>
```

### `--version` / `--help`

Self-explanatory.

## Programmatic use

```js
import { generateKeypair, decodePrivateKey } from 'agent-reputation/src/keys.mjs';
import { signAttestation, verifyAttestation } from 'agent-reputation/src/signature.mjs';

const kp = generateKeypair();
const priv = decodePrivateKey(kp.private_key);

const unsigned = {
  format: 'agent-reputation-attestation',
  version: '0.1',
  attestor: { id: 'did:web:me', public_key: kp.public_key },
  subject: { id: 'did:web:other' },
  task_class: 'summarization',
  outcome: 'success',
  confidence: 0.9,
  issued_at: new Date().toISOString(),
};

const signature = signAttestation(unsigned, priv);
const signed = { ...unsigned, signature };

const valid = verifyAttestation(signed); // true
```

## Limitations (alpha)

- Single-attestation only. Aggregation across attestations is v0.2.
- Ed25519 only. RSA / ECDSA are v0.2 candidates.
- No revocation, no key rotation, no replay protection.
- `task_class` is opaque — no standardized vocabulary in v0.1.
- Identity model is opaque — no DID resolution.
