#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { validateAttestation } from './schema/attestation.mjs';
import { generateKeypair, decodePrivateKey } from './keys.mjs';
import { signAttestation, verifyAttestation } from './signature.mjs';

const VERSION = '0.1.0';

function printHelp() {
  console.log(`agent-reputation ${VERSION}

Vendor-neutral attestation format for agent reputation.

Usage:
  agent-reputation keygen   --out <keypair.json>
  agent-reputation attest   --keys <keypair.json> --attestor-id <id> --subject <id> \\
                            --task <class> --outcome <success|failure> \\
                            --confidence <0-1> --out <attestation.json>
  agent-reputation verify   --file <attestation.json>
  agent-reputation validate --file <attestation.json>
  agent-reputation --version
  agent-reputation --help

The 'verify' command checks the signature using the public key embedded in
the attestation — no separate keys argument needed.
`);
}

function commandKeygen(args) {
  const { values } = parseArgs({
    args,
    options: { out: { type: 'string', short: 'o' } },
    strict: true,
  });
  if (!values.out) {
    console.error('error: --out <path> is required');
    return 2;
  }
  const kp = generateKeypair();
  try {
    writeFileSync(resolve(values.out), JSON.stringify(kp, null, 2), 'utf-8');
  } catch (err) {
    console.error(`error: cannot write ${values.out}: ${err.message}`);
    return 1;
  }
  console.log(`generated Ed25519 keypair → ${resolve(values.out)}`);
  console.log(`  public_key:  ${kp.public_key}`);
  return 0;
}

function commandAttest(args) {
  const { values } = parseArgs({
    args,
    options: {
      keys: { type: 'string', short: 'k' },
      'attestor-id': { type: 'string' },
      subject: { type: 'string', short: 's' },
      task: { type: 'string', short: 't' },
      outcome: { type: 'string' },
      confidence: { type: 'string', short: 'c' },
      out: { type: 'string', short: 'o' },
    },
    strict: true,
  });
  const required = ['keys', 'attestor-id', 'subject', 'task', 'outcome', 'confidence', 'out'];
  const missing = required.filter((k) => !values[k]);
  if (missing.length) {
    console.error(`error: missing required args: ${missing.map((k) => `--${k}`).join(', ')}`);
    return 2;
  }
  let kp;
  try {
    kp = JSON.parse(readFileSync(resolve(values.keys), 'utf-8'));
  } catch (err) {
    console.error(`error: cannot read keys ${values.keys}: ${err.message}`);
    return 1;
  }
  if (!kp.private_key || !kp.public_key) {
    console.error('error: keys file must contain private_key and public_key fields');
    return 1;
  }

  const confidence = Number(values.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    console.error(`error: --confidence must be a number in [0, 1], got "${values.confidence}"`);
    return 2;
  }
  if (values.outcome !== 'success' && values.outcome !== 'failure') {
    console.error(`error: --outcome must be "success" or "failure", got "${values.outcome}"`);
    return 2;
  }

  const unsigned = {
    format: 'agent-reputation-attestation',
    version: '0.1',
    attestor: { id: values['attestor-id'], public_key: kp.public_key },
    subject: { id: values.subject },
    task_class: values.task,
    outcome: values.outcome,
    confidence,
    issued_at: new Date().toISOString(),
  };

  let privKey;
  try {
    privKey = decodePrivateKey(kp.private_key);
  } catch (err) {
    console.error(`error: cannot decode private key: ${err.message}`);
    return 1;
  }

  const signature = signAttestation(unsigned, privKey);
  const signed = { ...unsigned, signature };

  try {
    writeFileSync(resolve(values.out), JSON.stringify(signed, null, 2), 'utf-8');
  } catch (err) {
    console.error(`error: cannot write ${values.out}: ${err.message}`);
    return 1;
  }
  console.log(`attestation signed → ${resolve(values.out)}`);
  return 0;
}

function commandVerify(args) {
  const { values } = parseArgs({
    args,
    options: { file: { type: 'string', short: 'f' } },
    strict: true,
  });
  if (!values.file) {
    console.error('error: --file <path> is required');
    return 2;
  }
  let raw;
  try {
    raw = readFileSync(resolve(values.file), 'utf-8');
  } catch (err) {
    console.error(`error: cannot read ${values.file}: ${err.message}`);
    return 1;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`error: input is not valid JSON: ${err.message}`);
    return 1;
  }
  const schemaCheck = validateAttestation(parsed);
  if (!schemaCheck.ok) {
    console.error('error: attestation schema invalid:');
    for (const e of schemaCheck.errors) console.error(`  - ${e}`);
    return 1;
  }
  const valid = verifyAttestation(parsed);
  if (valid) {
    console.log(`OK — attestation verified (attestor: ${parsed.attestor.id})`);
    return 0;
  }
  console.error(
    'FAIL — attestation signature invalid (tampered data, wrong key, or bad signature)',
  );
  return 1;
}

function commandValidate(args) {
  const { values } = parseArgs({
    args,
    options: { file: { type: 'string', short: 'f' } },
    strict: true,
  });
  if (!values.file) {
    console.error('error: --file <path> is required');
    return 2;
  }
  let raw;
  try {
    raw = readFileSync(resolve(values.file), 'utf-8');
  } catch (err) {
    console.error(`error: cannot read ${values.file}: ${err.message}`);
    return 1;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`error: input is not valid JSON: ${err.message}`);
    return 1;
  }
  const r = validateAttestation(parsed);
  if (r.ok) {
    console.log('OK — attestation conforms to agent-reputation-attestation v0.1');
    return 0;
  }
  console.error('FAIL — attestation schema errors:');
  for (const e of r.errors) console.error(`  - ${e}`);
  return 1;
}

function main(argv) {
  const [, , command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return 0;
  }
  if (command === '--version' || command === '-v') {
    console.log(VERSION);
    return 0;
  }
  switch (command) {
    case 'keygen':
      return commandKeygen(rest);
    case 'attest':
      return commandAttest(rest);
    case 'verify':
      return commandVerify(rest);
    case 'validate':
      return commandValidate(rest);
    default:
      console.error(`error: unknown command: ${command}`);
      printHelp();
      return 2;
  }
}

const invokedAsScript = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (invokedAsScript) {
  process.exit(main(process.argv));
}

export { main };
