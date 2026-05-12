import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateAttestation } from '../src/schema/attestation.mjs';
import { verifyAttestation } from '../src/signature.mjs';
import { truncateAuditLog, countExternalCalls } from '../src/audit.mjs';
import { scoreSample } from './score.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadJsonl(p) {
  return readFileSync(p, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function pct(x) {
  return (x * 100).toFixed(1) + '%';
}

function runSample(bundle) {
  if (bundle.__malformed__) {
    try {
      const att = JSON.parse(bundle.__raw__);
      const v = validateAttestation(att);
      if (!v.ok) throw new Error(`schema: ${v.errors.join('; ')}`);
      const ok = verifyAttestation(att);
      if (!ok) throw new Error('signature invalid');
      return { ok: true, verified: true };
    } catch (err) {
      return { ok: false, error: String(err.message ?? err) };
    }
  }

  try {
    const att = bundle.attestation;
    const v = validateAttestation(att);
    if (!v.ok) throw new Error(`schema: ${v.errors.join('; ')}`);
    const ok = verifyAttestation(att);
    if (!ok) throw new Error('signature invalid');
    return { ok: true, verified: true };
  } catch (err) {
    return { ok: false, error: String(err.message ?? err) };
  }
}

function main() {
  const auditLogPath = join(__dirname, '..', 'logs', 'network.jsonl');
  truncateAuditLog(auditLogPath);

  const samples = loadJsonl(join(__dirname, 'data', 'samples.jsonl'));
  const expectedAll = loadJsonl(join(__dirname, 'data', 'expected.jsonl'));

  if (samples.length !== expectedAll.length) {
    console.error(`mismatch: ${samples.length} samples vs ${expectedAll.length} expected rows`);
    process.exit(1);
  }

  console.log(`[agent-reputation] running benchmark — ${samples.length} samples`);

  let happyPass = 0, edgePass = 0, malformedPass = 0;
  const happyTotal = 15, edgeTotal = 10, malformedTotal = 5;
  const failures = [];

  for (let i = 0; i < samples.length; i++) {
    const actual = runSample(samples[i]);
    const score = scoreSample(actual, expectedAll[i]);
    if (score.passed) {
      if (i < 15) happyPass++;
      else if (i < 25) edgePass++;
      else malformedPass++;
    } else {
      failures.push({ index: i + 1, reason: score.reason });
    }
  }

  const totalPass = happyPass + edgePass + malformedPass;

  console.log('');
  console.log(`  parsing samples...    ${samples.length}/${samples.length} OK`);
  console.log(`  scoring...            ${samples.length}/${samples.length} OK`);
  console.log('');
  console.log('FIDELITY:');
  console.log(`  happy-path (${happyTotal}):  ${happyPass}/${happyTotal} (${pct(happyPass / happyTotal)})`);
  console.log(`  edge-case (${edgeTotal}):   ${edgePass}/${edgeTotal} (${pct(edgePass / edgeTotal)})`);
  console.log(`  malformed (${malformedTotal}):    ${malformedPass}/${malformedTotal} errored cleanly (${pct(malformedPass / malformedTotal)})`);
  console.log('');
  console.log(`  total:                ${totalPass}/${samples.length} (${pct(totalPass / samples.length)})`);

  const externalCalls = countExternalCalls(auditLogPath);
  console.log('');
  console.log('NETWORK FOOTPRINT:');
  console.log(`  external calls:  ${externalCalls}`);
  console.log(`  audit log:       ${auditLogPath}`);
  console.log('');

  let band;
  if (totalPass === samples.length && externalCalls === 0) band = 'Strong';
  else if (totalPass / samples.length >= 0.95 && externalCalls === 0) band = 'Acceptable';
  else band = 'Weak';
  console.log(`STATUS: ${band} band`);

  if (failures.length) {
    console.log('');
    console.log('Failures:');
    for (const f of failures) console.log(`  sample ${f.index}: ${f.reason}`);
  }

  if (externalCalls > 0) {
    console.error('FAIL: benchmark detected external network calls. Privacy claim broken.');
    process.exit(2);
  }
  if (band === 'Weak') process.exit(3);
}

main();
