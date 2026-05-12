# A2A/AGNTCY community post draft — agent-reputation

## Target channel

`<TBD-after-research>` — research required pre-launch. Likely candidates: AGNTCY Discord (agntcy.org for invite), A2A protocol GitHub Discussions, LinkedIn AI-agents groups. Read past 7 days of activity, note tone (technical-formal vs casual), whether self-promotion is welcome.

## Opening post

(Copy from "Hi all," through "Happy to discuss in thread." into the chosen channel as plain markdown — no code fence.)

Hi all,

A2A defines how agents communicate. It doesn't define how agents come to trust each other, and every multi-agent framework I've looked at handles that ad-hoc or not at all.

I drafted a small vendor-neutral attestation format aimed at filling that gap: agent-reputation. It defines:

- A JSON attestation: `{attestor, subject, task_class, outcome, confidence, issued_at, signature}`
- Ed25519 signing with deep-canonical JSON serialization (so signatures roundtrip regardless of key order)
- **Self-contained verification** — each attestation embeds the attestor's public key. Verifier needs only the attestation file.

Why Ed25519 specifically: HMAC requires pre-shared secrets (wrong primitive for cross-org agent contexts), and JWT has the algorithm-confusion attack surface. Ed25519 with the algorithm pinned in the spec (not the payload) is the smallest surface area.

Reference Node CLI implements keygen, attest, verify, validate. 100% verification fidelity on a 30-sample benchmark.

Code + spec: github.com/Accuoa/agent-reputation
Demo: accuoa.github.io/agent-reputation

Specifically curious for feedback from anyone working on agent trust:

1. Does the attestation format cover what your framework needs? What's missing?
2. Aggregation (combining N attestations into a reputation score) is out of v0.1 — what's the right approach for v0.2?
3. The self-contained-verification choice (public key embedded in every attestation) trades bandwidth for portability — wrong tradeoff for your use case?

Happy to discuss in thread.

## Posting cadence

- A2A/AGNTCY communities tend to be quieter than mainstream subreddits. Reply windows extend longer.
- Tone: technical, neutral, willing to be wrong. This is a protocol audience — bring receipts, expect pushback on details.

## What to NOT do

- Don't paste the same post across multiple channels.
- Don't link to a sales page or pricing.
- Don't oversell.
- Don't post before US morning / EU afternoon overlap unless the channel skews differently.

## After-action

T+24h: capture feedback in GitHub issues. Update Twitter thread Tweet 7 if anything noteworthy came up.
