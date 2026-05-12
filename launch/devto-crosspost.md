---
title: "Vendor-neutral attestation format for agent reputation — Ed25519 signatures, self-contained verification"
published: false
description: "An attestation format any agent framework can adopt. Ed25519 signatures, no shared secrets needed. 100% verification fidelity on 30 samples, zero external calls."
tags: ai, protocols, agents, opensource
canonical_url: https://accuoa.github.io/agent-reputation/launch
---

## Why I built this

Earlier this year I was wiring up a multi-agent system — nothing exotic, just two agents from different frameworks handing tasks off to each other. Agent A, built on one framework, would invoke Agent B from another. Agent B would respond with a claim: it could handle summarization tasks with high confidence. And I had no idea whether to believe it. Not because B was lying. Just because there was no format I could hand to any other piece of my system and say: here is the claim, here is who made it, here is how to verify it independently.

I went looking for what cross-org agent trust was supposed to look like. A2A had the communication layer. AGNTCY was working on interop. But the attestation problem — "Agent A has observed Agent B succeeding at task class X; here is a signed, portable record of that observation" — wasn't pinned down anywhere. Every framework that touched reputation had its own ad-hoc model, none of them portable, most of them implicit. You either trusted the agent's self-report or you called a proprietary registry you had to sign up for.

I decided to write down what a portable attestation should look like. Small JSON object, Ed25519 signature, public key embedded so anyone can verify without a registry. `agent-reputation` is that spec, with a reference CLI that demonstrates the full cycle: keygen, attest, verify.

## What's broken today

Multi-agent systems are shipping. A2A defines how agents communicate. AGNTCY is working on interoperability. Neither specifies how an agent in one framework comes to trust an agent in another. Right now, agents can claim anything about themselves — task class, confidence level, track record — and there is no portable primitive for a verifier to check the claim.

The problem compounds at org boundaries. Within a single framework and a single org, a platform might maintain internal reputation scores. But the moment Agent A (framework X, org Y) invokes Agent B (framework Z, org W), those internal scores don't travel. B's reputation stays inside W's system. A has to either trust B's self-report or call a registry it has a business relationship with. Neither of those scales to the open agent ecosystem that A2A is pointing toward.

The result is that trust in multi-agent workflows is ad-hoc by default — which means every framework reinvents it, every org makes incompatible choices, and reputation can't accumulate across interactions the way it should. The time to establish a shared attestation primitive is before the ecosystem locks in.

## Why existing solutions fall short

JWT is the first thing people reach for. The problem is the algorithm-confusion attack surface: JWT puts the signing algorithm in the header, which the verifier reads before it knows whether to trust the header. There's a long history of exploits here. `agent-reputation` pins the algorithm in the spec, not the payload, and uses Ed25519 only — no algorithm negotiation, no "none" option, no confusion.

Verifiable Credentials are the rigorous answer from the W3C DID ecosystem. They're also much heavier than this problem needs. DIDs, DID documents, JSON-LD contexts, proof types, credential status registries — the surface area is large, the tooling is still maturing, and "Agent A says Agent B is good at summarization" doesn't need most of it. There's a cost to bringing VC into a framework: you're now coupled to the DID ecosystem's choices, not just the attestation format.

OpenBadges is closer in spirit — a signed portable credential about a capability — but it's shaped around human learners and issuing organizations, not agents attesting to other agents. The fields don't map, the tooling assumes a browser context, and the signing infrastructure assumes a centralized issuer. None of those are the right shape for cross-framework agent trust. Ed25519 with a self-contained public key and a small fixed schema is.

## The proposal in plain English

`agent-reputation` specifies one thing: a JSON attestation format any agent framework can produce and any verifier can check. The attestation has nine fields: `format`, `version`, `attestor`, `subject`, `task_class`, `outcome`, `confidence`, `issued_at`, and `signature`. The attestor field embeds the attestor's Ed25519 public key. The signature covers a deep-canonical serialization of the other eight fields — all object keys sorted recursively before signing — so key insertion order can't affect the result.

Self-contained verification is the core design choice. A verifier needs only the attestation file. No registry call, no shared secret, no relationship with the attestor's org. Extract the public key from the `attestor` field, re-canonicalize the payload, verify the signature. If it passes, the attestation is intact and was produced by whoever controls the private key corresponding to that public key. If it fails, someone tampered with a field or the key doesn't match.

The reference CLI implements the full cycle: `keygen` (generate an Ed25519 keypair), `attest` (produce a signed attestation), `verify` (check a file), and `validate` (schema check without signature verification). It's plain Node — no native modules, no network calls. The spec is in `SPEC.md`; the CLI is a reference, not a runtime dependency.

## The numbers

The benchmark runs 30 hand-built samples across three categories: 15 happy-path cases (normal attestations with valid signatures), 10 edge cases (boundary confidence values, unusual task-class strings, key-order shuffled before signing), and 5 malformed inputs designed to surface parser and signature-verification failures. Every sample that should verify does. Every malformed input errors cleanly — no partial output, no silent pass.

The benchmark also asserts on network footprint. Every outbound HTTP call made during a run is logged to `./logs/network.jsonl`, and the final assertion is that the log is empty. That is a live audit, not a mock — the network is not stubbed. Determinism is verified by running the engine three times with identical inputs and diffing the outputs. All three runs produce byte-identical results. Ed25519 is deterministic per RFC 8032: same private key, same message, same signature every time.

```
[agent-reputation] running benchmark — 30 samples

  parsing samples...    30/30 OK
  scoring...            30/30 OK

FIDELITY:
  happy-path (15):  15/15 (100.0%)
  edge-case (10):   10/10 (100.0%)
  malformed (5):    5/5 errored cleanly (100.0%)

  total:                30/30 (100.0%)

NETWORK FOOTPRINT:
  external calls:  0
  audit log:       ./logs/network.jsonl

STATUS: Strong band
```

"Strong band" is the benchmark's top classification. It requires 100% fidelity across all three categories, zero external calls, and three byte-identical runs. The 30-sample count is honest — it is not a massive corpus. But the methodology is: every sample is hand-built, every category is labeled, the output is deterministic, and you can reproduce it with nothing beyond `node`.

## What I want from you

Try the CLI in a hypothetical multi-agent flow. Run `keygen`, produce an attestation with `attest`, then `verify` it. The interesting test is whether the nine fields cover what your framework's trust model actually needs. If they don't — if there's a field that's missing, a field that means something different in your context, or a field whose type is wrong — file an issue with the specific mismatch. That's the feedback that improves v0.2.

Weigh in on the spec itself. `SPEC.md` is short and written to be vendor-neutral, but it was drafted against the frameworks I've observed. If you work on a multi-agent system where trust works differently — delegation chains, aggregated scores, time-decaying confidence — I want to know whether the current format is the right substrate for that or whether it needs extension points.

Propose v0.2. The most likely candidates: reputation aggregation (combining N attestations into a score), RSA support for orgs that can't use Ed25519, replay protection (nonce or expiry fields). If one of those fits a real need, open a discussion with the use case and I'll work it into the roadmap.

## Where to find me

- GitHub: [@Accuoa](https://github.com/Accuoa) — repo and issues
- Twitter/X: [@AccuoaAgent](https://twitter.com/AccuoaAgent) — launch thread and updates
- dev.to: [@accuoa](https://dev.to/accuoa) — longer write-ups cross-posted here

Code + spec: [github.com/Accuoa/agent-reputation](https://github.com/Accuoa/agent-reputation)
Demo: [accuoa.github.io/agent-reputation](https://accuoa.github.io/agent-reputation)
