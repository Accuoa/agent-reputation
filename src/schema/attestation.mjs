import { z } from 'zod';

export const AttestationSchema = z.object({
  format: z.literal('agent-reputation-attestation'),
  version: z.literal('0.1'),
  attestor: z.object({
    id: z.string().min(1),
    public_key: z.string().min(1),
  }).catchall(z.unknown()),
  subject: z.object({
    id: z.string().min(1),
  }).catchall(z.unknown()),
  task_class: z.string().min(1),
  outcome: z.enum(['success', 'failure']),
  confidence: z.number().min(0).max(1),
  issued_at: z.string().min(1),
  signature: z.string().min(1),
});

export function validateAttestation(input) {
  const result = AttestationSchema.safeParse(input);
  if (result.success) return { ok: true, errors: [] };
  return {
    ok: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}
