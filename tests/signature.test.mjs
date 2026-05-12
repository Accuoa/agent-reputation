import { describe, it, expect } from 'vitest';
import { canonicalize, signAttestation, verifyAttestation } from '../src/signature.mjs';
import { generateKeypair, decodePrivateKey } from '../src/keys.mjs';

const baseAttestation = {
  format: 'agent-reputation-attestation',
  version: '0.1',
  attestor: { id: 'did:web:a', public_key: 'placeholder' },
  subject: { id: 'did:web:b' },
  task_class: 'summarization',
  outcome: 'success',
  confidence: 0.9,
  issued_at: '2026-05-12T00:00:00Z',
};

describe('canonicalize', () => {
  it('produces identical strings regardless of top-level key order', () => {
    const a = { format: 'x', version: '0.1', task_class: 't' };
    const b = { task_class: 't', version: '0.1', format: 'x' };
    expect(canonicalize(a)).toBe(canonicalize(b));
  });

  it('produces identical strings regardless of nested key order', () => {
    const a = { attestor: { id: 'a', public_key: 'b' } };
    const b = { attestor: { public_key: 'b', id: 'a' } };
    expect(canonicalize(a)).toBe(canonicalize(b));
  });

  it('preserves array element order', () => {
    expect(canonicalize({ list: [1, 2, 3] })).not.toBe(canonicalize({ list: [3, 2, 1] }));
  });
});

describe('signAttestation', () => {
  it('returns a base64 signature string', () => {
    const kp = generateKeypair();
    const priv = decodePrivateKey(kp.private_key);
    const att = { ...baseAttestation, attestor: { ...baseAttestation.attestor, public_key: kp.public_key } };
    const sig = signAttestation(att, priv);
    expect(typeof sig).toBe('string');
    expect(sig).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('produces deterministic signatures (Ed25519 is deterministic)', () => {
    const kp = generateKeypair();
    const priv = decodePrivateKey(kp.private_key);
    const att = { ...baseAttestation, attestor: { ...baseAttestation.attestor, public_key: kp.public_key } };
    expect(signAttestation(att, priv)).toBe(signAttestation(att, priv));
  });

  it('produces identical signature regardless of input key order', () => {
    const kp = generateKeypair();
    const priv = decodePrivateKey(kp.private_key);
    const att1 = { ...baseAttestation, attestor: { ...baseAttestation.attestor, public_key: kp.public_key } };
    const att2 = {
      issued_at: att1.issued_at,
      confidence: att1.confidence,
      outcome: att1.outcome,
      task_class: att1.task_class,
      subject: { id: att1.subject.id },
      attestor: { public_key: att1.attestor.public_key, id: att1.attestor.id },
      version: att1.version,
      format: att1.format,
    };
    expect(signAttestation(att1, priv)).toBe(signAttestation(att2, priv));
  });

  it('produces different signatures for different keys', () => {
    const kpA = generateKeypair();
    const kpB = generateKeypair();
    const privA = decodePrivateKey(kpA.private_key);
    const privB = decodePrivateKey(kpB.private_key);
    const att = { ...baseAttestation, attestor: { ...baseAttestation.attestor, public_key: kpA.public_key } };
    expect(signAttestation(att, privA)).not.toBe(signAttestation(att, privB));
  });

  it('excludes signature field if present in input', () => {
    const kp = generateKeypair();
    const priv = decodePrivateKey(kp.private_key);
    const att = { ...baseAttestation, attestor: { ...baseAttestation.attestor, public_key: kp.public_key } };
    const withSig = { ...att, signature: 'oldsig' };
    expect(signAttestation(att, priv)).toBe(signAttestation(withSig, priv));
  });
});

describe('verifyAttestation', () => {
  it('returns true for correctly signed attestation (using embedded public key)', () => {
    const kp = generateKeypair();
    const priv = decodePrivateKey(kp.private_key);
    const att = { ...baseAttestation, attestor: { ...baseAttestation.attestor, public_key: kp.public_key } };
    const sig = signAttestation(att, priv);
    expect(verifyAttestation({ ...att, signature: sig })).toBe(true);
  });

  it('returns false when signature is tampered', () => {
    const kp = generateKeypair();
    const priv = decodePrivateKey(kp.private_key);
    const att = { ...baseAttestation, attestor: { ...baseAttestation.attestor, public_key: kp.public_key } };
    const sig = signAttestation(att, priv);
    const tampered = sig.slice(0, -4) + 'AAAA';
    expect(verifyAttestation({ ...att, signature: tampered })).toBe(false);
  });

  it('returns false when data is tampered after signing', () => {
    const kp = generateKeypair();
    const priv = decodePrivateKey(kp.private_key);
    const att = { ...baseAttestation, attestor: { ...baseAttestation.attestor, public_key: kp.public_key } };
    const sig = signAttestation(att, priv);
    expect(verifyAttestation({ ...att, confidence: 0.1, signature: sig })).toBe(false);
  });

  it('returns false when public key in attestation does not match the signing key', () => {
    const kpA = generateKeypair();
    const kpB = generateKeypair();
    const privA = decodePrivateKey(kpA.private_key);
    const att = { ...baseAttestation, attestor: { ...baseAttestation.attestor, public_key: kpB.public_key } };
    const sig = signAttestation(att, privA);
    expect(verifyAttestation({ ...att, signature: sig })).toBe(false);
  });

  it('returns false when signature is missing', () => {
    const kp = generateKeypair();
    const att = { ...baseAttestation, attestor: { ...baseAttestation.attestor, public_key: kp.public_key } };
    expect(verifyAttestation(att)).toBe(false);
  });

  it('verifies independent of attestation key order', () => {
    const kp = generateKeypair();
    const priv = decodePrivateKey(kp.private_key);
    const att = { ...baseAttestation, attestor: { ...baseAttestation.attestor, public_key: kp.public_key } };
    const sig = signAttestation(att, priv);
    const reordered = {
      signature: sig,
      issued_at: att.issued_at,
      confidence: att.confidence,
      outcome: att.outcome,
      task_class: att.task_class,
      subject: { id: att.subject.id },
      attestor: { public_key: att.attestor.public_key, id: att.attestor.id },
      version: att.version,
      format: att.format,
    };
    expect(verifyAttestation(reordered)).toBe(true);
  });
});
