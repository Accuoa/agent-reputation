import { describe, it, expect } from 'vitest';
import { scoreSample } from '../benchmark/score.mjs';

describe('scoreSample', () => {
  it('passes for happy path when verified flag matches', () => {
    expect(scoreSample({ ok: true, verified: true }, { verified: true }).passed).toBe(true);
  });

  it('fails when verified flag mismatches', () => {
    const r = scoreSample({ ok: true, verified: false }, { verified: true });
    expect(r.passed).toBe(false);
    expect(r.reason).toMatch(/verified/i);
  });

  it('passes for malformed sample when error matches regex', () => {
    expect(
      scoreSample({ ok: false, error: 'signature invalid' }, { expected_error: 'signature|verify' })
        .passed,
    ).toBe(true);
  });

  it('fails for malformed sample when actual succeeds', () => {
    const r = scoreSample({ ok: true, verified: true }, { expected_error: 'signature' });
    expect(r.passed).toBe(false);
    expect(r.reason).toMatch(/expected error/i);
  });

  it('fails for malformed sample when error regex does not match', () => {
    const r = scoreSample(
      { ok: false, error: 'something else broke' },
      { expected_error: 'signature' },
    );
    expect(r.passed).toBe(false);
    expect(r.reason).toMatch(/did not match/i);
  });

  it('fails when actual.ok is false and no expected_error given', () => {
    const r = scoreSample({ ok: false, error: 'unexpected failure' }, { verified: true });
    expect(r.passed).toBe(false);
    expect(r.reason).toMatch(/unexpected error/i);
  });
});
