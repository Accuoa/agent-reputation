export function scoreSample(actual, expected) {
  if ('expected_error' in expected) {
    if (actual.ok) {
      return {
        passed: false,
        reason: `expected error matching ${expected.expected_error} but got success`,
      };
    }
    const re = new RegExp(expected.expected_error, 'i');
    if (!re.test(actual.error)) {
      return {
        passed: false,
        reason: `error "${actual.error}" did not match pattern ${expected.expected_error}`,
      };
    }
    return { passed: true };
  }

  if (!actual.ok) {
    return { passed: false, reason: `unexpected error: ${actual.error}` };
  }

  if (actual.verified !== expected.verified) {
    return {
      passed: false,
      reason: `verified mismatch: got ${actual.verified}, expected ${expected.verified}`,
    };
  }

  return { passed: true };
}
