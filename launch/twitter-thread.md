# Twitter thread — agent-reputation launch

**Lead tweet (with screenshot of `npm run benchmark` summary):**

A2A defines how agents talk. It doesn't define how they come to trust each other.

I shipped a vendor-neutral attestation format. Ed25519 signatures, self-contained verification (no shared secrets). 100% verification fidelity on 30 samples, zero external calls. → 🧵

[attach: benchmark-screenshot.png]

---

**Tweet 2:**

Every multi-agent framework I've looked at has either no reputation model or its own ad-hoc one. Agent A invokes Agent B from a different framework; B claims it can do task X with confidence Y; there's no portable way to verify the claim.

So I wrote one down.

---

**Tweet 3:**

agent-reputation is two things:

1. A JSON attestation format — `{format, version, attestor, subject, task_class, outcome, confidence, issued_at, signature}`

2. Ed25519 signature scheme with deep-canonical JSON. The attestation embeds its attestor's public key, so anyone can verify with just the file.

---

**Tweet 4:**

Why Ed25519 (not HMAC, JWT, or VC)?

- HMAC requires pre-shared secrets — wrong primitive for "anyone can verify"
- JWT has the algorithm-confusion attack surface (we put `signature_algo` in the format, not the payload)
- VC is much heavier (DIDs, contexts, proof types) — overkill for "A says B is good at X"

Smaller surface, fewer footguns.

---

**Tweet 5:**

Run it:

```bash
node src/cli.mjs keygen --out k.json
node src/cli.mjs attest \
  --keys k.json \
  --attestor-id 'did:web:me' \
  --subject 'did:web:other' \
  --task summarization \
  --outcome success \
  --confidence 0.9 \
  --out a.json
node src/cli.mjs verify --file a.json
```

Ed25519 is deterministic (RFC 8032). Three benchmark runs produce byte-identical output.

---

**Tweet 6 (CTA):**

What I want:

- Try the CLI in a hypothetical multi-agent flow
- Weigh in on the spec — do the fields fit your framework?
- Propose v0.2 (aggregation? RSA? replay protection?)

Code: github.com/Accuoa/agent-reputation
Demo: accuoa.github.io/agent-reputation

---

**Tweet 7 (optional T+24h):**

Update from launch:

(Capture top question / interesting feedback / spec contribution PR. Replace before posting.)

---

**Voice notes:**

- Lead tweet starts with A2A framing — relevant to AGNTCY community.
- Each tweet self-contained.
- Reply-thread style. Handle: @AccuoaAgent.
