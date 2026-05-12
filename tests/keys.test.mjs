import { describe, it, expect } from 'vitest';
import {
  generateKeypair,
  encodePublicKey,
  encodePrivateKey,
  decodePublicKey,
  decodePrivateKey,
} from '../src/keys.mjs';
import { sign, verify } from 'node:crypto';

describe('generateKeypair', () => {
  it('returns an object with private_key and public_key as base64 strings', () => {
    const kp = generateKeypair();
    expect(typeof kp.private_key).toBe('string');
    expect(typeof kp.public_key).toBe('string');
    expect(kp.private_key).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(kp.public_key).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('produces 32-byte raw keys (44 base64 chars with padding)', () => {
    const kp = generateKeypair();
    expect(Buffer.from(kp.private_key, 'base64')).toHaveLength(32);
    expect(Buffer.from(kp.public_key, 'base64')).toHaveLength(32);
  });

  it('produces different keypairs on successive calls', () => {
    const a = generateKeypair();
    const b = generateKeypair();
    expect(a.private_key).not.toBe(b.private_key);
    expect(a.public_key).not.toBe(b.public_key);
  });
});

describe('encode/decode roundtrip', () => {
  it('encodes and decodes a public key', () => {
    const kp = generateKeypair();
    const decoded = decodePublicKey(kp.public_key);
    const re_encoded = encodePublicKey(decoded);
    expect(re_encoded).toBe(kp.public_key);
  });

  it('encodes and decodes a private key', () => {
    const kp = generateKeypair();
    const decoded = decodePrivateKey(kp.private_key);
    const re_encoded = encodePrivateKey(decoded);
    expect(re_encoded).toBe(kp.private_key);
  });
});

describe('decoded keys are usable for sign/verify', () => {
  it('signs and verifies using decoded keys', () => {
    const kp = generateKeypair();
    const priv = decodePrivateKey(kp.private_key);
    const pub = decodePublicKey(kp.public_key);
    const msg = Buffer.from('hello world');
    const sig = sign(null, msg, priv);
    expect(verify(null, msg, pub, sig)).toBe(true);
  });

  it('verify returns false for tampered message', () => {
    const kp = generateKeypair();
    const priv = decodePrivateKey(kp.private_key);
    const pub = decodePublicKey(kp.public_key);
    const sig = sign(null, Buffer.from('hello'), priv);
    expect(verify(null, Buffer.from('world'), pub, sig)).toBe(false);
  });

  it('verify returns false for wrong public key', () => {
    const kpA = generateKeypair();
    const kpB = generateKeypair();
    const priv = decodePrivateKey(kpA.private_key);
    const wrongPub = decodePublicKey(kpB.public_key);
    const sig = sign(null, Buffer.from('hello'), priv);
    expect(verify(null, Buffer.from('hello'), wrongPub, sig)).toBe(false);
  });

  it('Ed25519 is deterministic (same key + message → same signature)', () => {
    const kp = generateKeypair();
    const priv = decodePrivateKey(kp.private_key);
    const msg = Buffer.from('test message');
    const sig1 = sign(null, msg, priv).toString('base64');
    const sig2 = sign(null, msg, priv).toString('base64');
    expect(sig1).toBe(sig2);
  });
});
