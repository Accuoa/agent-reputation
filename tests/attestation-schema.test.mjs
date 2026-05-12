import { describe, it, expect } from 'vitest';
import { AttestationSchema, validateAttestation } from '../src/schema/attestation.mjs';

const valid = {
  format: 'agent-reputation-attestation',
  version: '0.1',
  attestor: {
    id: 'did:web:example.com:agent:scribe',
    public_key: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=',
  },
  subject: { id: 'did:web:other.com:agent:summarizer' },
  task_class: 'summarization',
  outcome: 'success',
  confidence: 0.9,
  issued_at: '2026-05-12T00:00:00Z',
  signature: 'c2lnbmF0dXJlLWJ5dGVz',
};

describe('AttestationSchema', () => {
  it('accepts a valid attestation', () => {
    expect(() => AttestationSchema.parse(valid)).not.toThrow();
  });

  it('rejects wrong format literal', () => {
    expect(() => AttestationSchema.parse({ ...valid, format: 'wrong' })).toThrow();
  });

  it('rejects wrong version literal', () => {
    expect(() => AttestationSchema.parse({ ...valid, version: '0.2' })).toThrow();
  });

  it('rejects empty attestor.id', () => {
    expect(() => AttestationSchema.parse({ ...valid, attestor: { ...valid.attestor, id: '' } })).toThrow();
  });

  it('rejects empty attestor.public_key', () => {
    expect(() => AttestationSchema.parse({ ...valid, attestor: { ...valid.attestor, public_key: '' } })).toThrow();
  });

  it('rejects empty subject.id', () => {
    expect(() => AttestationSchema.parse({ ...valid, subject: { id: '' } })).toThrow();
  });

  it('rejects empty task_class', () => {
    expect(() => AttestationSchema.parse({ ...valid, task_class: '' })).toThrow();
  });

  it('rejects invalid outcome (must be success or failure)', () => {
    expect(() => AttestationSchema.parse({ ...valid, outcome: 'neutral' })).toThrow();
  });

  it('accepts outcome success', () => {
    expect(() => AttestationSchema.parse({ ...valid, outcome: 'success' })).not.toThrow();
  });

  it('accepts outcome failure', () => {
    expect(() => AttestationSchema.parse({ ...valid, outcome: 'failure' })).not.toThrow();
  });

  it('rejects confidence > 1', () => {
    expect(() => AttestationSchema.parse({ ...valid, confidence: 1.5 })).toThrow();
  });

  it('rejects confidence < 0', () => {
    expect(() => AttestationSchema.parse({ ...valid, confidence: -0.1 })).toThrow();
  });

  it('accepts confidence boundary 0.0', () => {
    expect(() => AttestationSchema.parse({ ...valid, confidence: 0.0 })).not.toThrow();
  });

  it('accepts confidence boundary 1.0', () => {
    expect(() => AttestationSchema.parse({ ...valid, confidence: 1.0 })).not.toThrow();
  });

  it('rejects empty signature', () => {
    expect(() => AttestationSchema.parse({ ...valid, signature: '' })).toThrow();
  });

  it('accepts catchall fields on attestor and subject (forward-compat)', () => {
    const ext = { ...valid, attestor: { ...valid.attestor, extra: 'x' }, subject: { id: valid.subject.id, extra: 'y' } };
    expect(() => AttestationSchema.parse(ext)).not.toThrow();
  });
});

describe('validateAttestation', () => {
  it('returns ok=true for valid input', () => {
    const r = validateAttestation(valid);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('returns ok=false with errors for invalid input', () => {
    const r = validateAttestation({ format: 'wrong' });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});
