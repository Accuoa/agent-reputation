import { sign as cryptoSign, verify as cryptoVerify } from 'node:crypto';
import { decodePublicKey } from './keys.mjs';

/**
 * Deep-canonicalize an object for deterministic JSON serialization.
 * Recursively sorts object keys. Preserves array element order.
 */
export function canonicalize(obj) {
  if (Array.isArray(obj)) {
    return JSON.stringify(obj.map((v) => JSON.parse(canonicalize(v))));
  }
  if (obj !== null && typeof obj === 'object') {
    const sorted = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = JSON.parse(canonicalize(obj[key]));
    }
    return JSON.stringify(sorted);
  }
  return JSON.stringify(obj);
}

/**
 * Sign an attestation. Excludes the `signature` field from the signed payload.
 * Returns the signature as a base64 string. Ed25519 (deterministic per RFC 8032).
 */
export function signAttestation(attestation, privateKey) {
  const { signature: _, ...unsigned } = attestation;
  const payload = Buffer.from(canonicalize(unsigned));
  const sig = cryptoSign(null, payload, privateKey);
  return sig.toString('base64');
}

/**
 * Verify an attestation. Self-contained: uses public key embedded in
 * attestation.attestor.public_key. Returns true iff signature is valid.
 * Never throws — returns false on any error.
 */
export function verifyAttestation(attestation) {
  if (!attestation.signature) return false;
  if (!attestation.attestor?.public_key) return false;

  let publicKey;
  try {
    publicKey = decodePublicKey(attestation.attestor.public_key);
  } catch {
    return false;
  }

  let sigBytes;
  try {
    sigBytes = Buffer.from(attestation.signature, 'base64');
  } catch {
    return false;
  }

  const { signature: _, ...unsigned } = attestation;
  const payload = Buffer.from(canonicalize(unsigned));

  try {
    return cryptoVerify(null, payload, publicKey, sigBytes);
  } catch {
    return false;
  }
}
