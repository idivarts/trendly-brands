# Virality Engine — research + implementation plan

**Status:** proposal, for review
**Date:** 2026-10-29
**Scope:** `trendly-brands` (UI) + `backend-sls` (knowledge, scoring, generation)
**Goal:** teach the AI *what actually gets distributed* so every script/idea it
writes is built for it, and give the user a defensible 0–100 read on a piece
before they publish — overall, and split by Hook / Body / Action.

---

## Part 0 — The one honest caveat, up front

We cannot compute "probability this goes viral." That is not a modesty
disclaimer, it is what the evidence says:

- Pre-publication virality models in the literature are **dominated by
  channel-level features** — subscriber count, duration, title/description
  length — not by anything about the content. The best-documented open model
  reports ~86% accuracy / 0.89 ROC-AUC with *channel subscriber count as the top
  feature*, which mostly measures audience size, not craft.
- The one peer-reviewed paper that attacks this head-on states it plainly:
  predicting popularity before publication is "a challenging task, mainly due to
  the complexity of content distribution network as well as the number of
  factors that play part in this process."
- I found **no independent study** showing content-level features (motion,
  pacing, emotional tone) beat metadata on held-out data.

So the product promise has to be one notch more precise, and it is a *better*
promise:

> **The score measures how closely a piece conforms to the craft that drives the
> metrics the platforms demonstrably rank on — calibrated against this brand's
> own history.**

That is honest, it is actionable (every point is attached to a fix), and it is
defensible when a 91-scoring Reel flops. A "92% chance of going viral" number
would be astrology, and the first flop would destroy trust in the whole feature.

**Everything below is built on that framing.** Product copy follows it too (see
§7).

---

# PART 1 — RESEARCH

Every claim is tagged with its source strength:
**[P]** = platform's own documentation · **[A]** = peer-reviewed ·
**[T]** = third-party / vendor blog, unverified.

I deliberately separated these, because the short-form-marketing web is full of
confident numbers with no methodology ("70% completion threshold", "sends are
weighted 5×"). Those are useful as *directional heuristics*, worthless as
*thresholds we hardcode and show a user*. The rubric uses [P] and [A] for its
rules and treats [T] as soft priors only.

## 1.1 What the platforms actually rank on

### Instagram — Reels **[P]**
From Instagram's own *Instagram Ranking Explained*:

- The four predicted actions for Reels, in stated order of importance:
  **reshare → watch all the way through → like → visit the audio page.**
  The audio-page tap is explicitly described as "a proxy for whether or not you
  might be inspired to make your own reel."
- Reels also uses a direct survey input: whether people find a reel
  "worth their time or fun."
- Signal groups, roughly ordered: your activity → your history with the poster →
  information about the reel (audio, visuals, popularity) → information about
  the poster.
- **Explicit deprioritizers** — a Reel is made less visible for: low resolution,
  **visible watermarks**, being **muted**, being **bordered**, being
  **mostly text**, or **having already been posted on Instagram** (reposts).
  → *This list is a gift: it is six deterministic, checkable rules straight from
  the platform. They go into the validator in Phase 1.*
- Feed is different and shallower: it predicts dwell ("spending a few seconds on
  a post"), comment, like, share, profile-photo tap.
- Explore is different again: "the most important actions we predict in Explore
  include **likes, saves, and shares**", and raw popularity "matter[s] much more
  in Explore than they do in Feed or in Stories."

**Takeaway:** for Reels, *reshare and completion are the top two levers, and
"make me want to use this sound" is a real third.* For Explore, **saves** join
the top tier. A single CTA cannot optimise all of them, which is why CTA choice
has to be platform- and surface-aware (§5, dimension P3).

The widely-repeated "watch time, sends per reach, likes per reach" trio and the
"sends are weighted 3–5×" multiplier are **[T]** — traced to paraphrases of
Mosseri's remarks, with no primary source for the multiplier. We will not
hardcode either.

### TikTok — For You **[P]**
From TikTok's transparency centre and newsroom:

- The pipeline is: **candidate selection → interaction prediction → ranking →
  similarity de-duplication → recommendation rules.** Predictions estimate "the
  probability of liking, sharing, commenting, or skipping a given video."
- Inputs: user interactions; video information (captions, sounds, hashtags);
  device and account settings — and the last group "receive[s] lower weight than
  active engagement."
- **"Neither follower count nor whether the account has had previous
  high-performing videos are direct factors in the recommendation system."**
  → *This is the single most important fact for our ICP (solo founders, 2–3
  person teams, small accounts): on TikTok the piece is judged on its own. It is
  also the strongest argument for why a craft score is worth anything at all.*
- A similarity check swaps out near-duplicates (same sound, same creator
  back-to-back), and repetitive themes are limited.

Note **skip** is a named, predicted negative. That makes the hook not merely
"important" but the only thing standing between the video and an explicit
negative signal.

The "~70% completion rate to clear the test pool" and "15–20% rewatch rate"
figures are **[T]**, and the sources even disagree with each other on whether
2024's bar was 50%. Directional only.

### YouTube — Shorts **[P]**
- Studio exposes **"Shown in Feed"** and **"Viewed (vs. swiped away)"** — this
  is the platform telling creators the feed-test signal in its own words.
- Since 31 March 2025 a Shorts **view counts on any start or replay**, with no
  minimum watch time; `engagedViews` preserves the old counting. So raw view
  totals can rise while the swipe-away rate worsens — **views are now a vanity
  metric for Shorts and must not be the basis of our feedback loop.**
- The Analytics API gives us real retention: `audienceWatchRatio`,
  **`relativeRetentionPerformance`** (0–1, how well a video retains versus all
  YouTube videos *of similar length* — 0.5 = median), `startedWatching`,
  `stoppedWatching`, over the `elapsedVideoTimeRatio` dimension.
  → *`relativeRetentionPerformance` is the closest thing to ground truth for a
  craft score that exists on any platform.* Length-normalised, cross-platform-
  comparable in spirit, and per-position along the video so it maps directly
  onto Hook / Body / Payoff. **Worth confirming it is populated for Shorts** —
  the docs do not say either way, and audience-retention reports accept only one
  video id per call.

### LinkedIn **[T]**
No official documentation surfaced. Consistent third-party claims: dwell time is
the dominant video signal; native uploads beat link-outs; the first hour's
engagement gates further distribution; a 2026 "authenticity" change suppresses
engagement pods and "comment YES if you agree" prompts. Treat all of it as soft
prior, but note the direction agrees with Meta's long-standing stance below.

### Engagement bait **[P-historic]**
Facebook's December 2017 announcement demoted "engagement bait" — posts pushing
users to like, comment, or tag for reach ("Like this if…", "Tag someone who…",
"Comment if you…") — with stricter demotions for repeat offenders and a
classifier trained on categorised examples. I could not find a *current* Meta
policy page restating it, so the enforcement details are **[T]** today. But the
direction has never reversed on any platform, and LinkedIn's 2026 change points
the same way.

→ **Bait phrasing must be a penalty in the rubric, not a CTA suggestion.** This
is where a naive "maximise comments" scorer would actively hurt the user.

## 1.2 The mechanical chain (what a score is actually a proxy for)

Stripping the platform-specific vocabulary, every system above resolves to the
same four-stage funnel:

```
   1. SHOWN          platform picks you for a small test slice
          ↓  ← the hook decides this (skip / swipe-away is a predicted negative)
   2. NOT SKIPPED    viewer stays past the first 1–3s
          ↓  ← the body decides this (watch-through / dwell / audienceWatchRatio)
   3. COMPLETED      viewer reaches the end, maybe replays
          ↓  ← the payoff decides this (reshare is IG's #1 Reels prediction)
   4. PASSED ON      reshare / save / sound-tap → new test slice, larger
```

Two consequences that shape the whole design:

1. **The stages are multiplicative, not additive.** A 95-rated body behind a
   30-rated hook is worth nothing — nobody sees it. So the overall score needs a
   **hard cap when a stage fails**, not just a lower weighted average
   (§5.4). This is the single most common way a "content score" feature becomes
   useless: it averages a fatal flaw away into a comfortable 72.
2. **Stage 4 is the only one that compounds**, and it is driven by *why someone
   sends a thing to another person* — which is a social question, not a video-
   editing question. That is a distinct scored dimension, not a sub-item of the
   CTA.

## 1.3 Why people pass things on **[A]**

Berger & Milkman (2012, *Journal of Marketing Research*), on the NYT most-emailed
list over three months, plus controlled experiments:

- Virality is driven by **physiological arousal**, not valence. **Awe, anger and
  anxiety** (high-arousal) increase sharing; **sadness** (low-arousal, i.e.
  deactivating) decreases it.
- The effect **holds when controlling** for how surprising, interesting, or
  practically useful the content is, and for front-page placement — so it is not
  a proxy for "good article."
- The experiments establish causality and show it runs through *level of
  activation*.

Caveat: observational for most of its data, single publication. But it is the
most-cited result in the field and the direction is replicated downstream.

Berger's `STEPPS` (from *Contagious*) gives the operational checklist that the
Share-Trigger dimension is built from: **S**ocial currency, **T**riggers,
**E**motion, **P**ublic, **P**ractical value, **S**tories.

Of the six, four are controllable inside a 30-second video and map to things a
model can judge in a script: social currency ("does sending this make the sender
look informed/funny/early"), emotion (arousal level, per above), practical value
(a specific, usable takeaway), and stories (a concrete subject, not a list of
claims). **Triggers** and **Public** are campaign-level, not piece-level — they
belong in the Strategy module, not the per-content score.

## 1.4 The craft, phrased as decisions

The vendor-blog corpus is remarkably consistent on *qualitative* craft even where
its numbers are junk. Consolidating what multiple independent sources agree on,
and keeping only what is phrased as a number or a decision (an adjective like
"make it engaging" changes nothing — this is the same principle the existing
`designCraftInstructions` was written on):

**Structure.** Hook (0–3s) → context/setup → progression → payoff → one next
step. The hook opens a gap; the payoff must close *that* gap. Nesting several
open loops confuses more than it holds.

**Hook archetypes** that recur across every source: curiosity gap · bold or
contrarian claim · specific number · direct question the viewer already has ·
in-medias-res (start at the end / at the result) · pattern interrupt ·
negative-framing ("stop doing X") · demonstrated outcome in frame.

**Anti-patterns**, near-universal: throat-clearing openers ("hey guys", "in this
video", a logo animation, a greeting); burying the subject behind setup; a hook
that assumes the viewer already follows you.

**Pacing.** A new beat every few seconds, but sources diverge on the number
(2–4s cuts / 5–7s visual beats / a "small success" every 15–20s) and at least
one warns that effects every second produce noise rather than attention. So:
*cadence is a rule, the specific interval is a per-format default we can tune,
not a law.*

**Muted-first.** Burned-in captions and on-screen text carrying the idea, because
a large share of feed viewing is sound-off — and because Instagram explicitly
deprioritises **muted** reels **[P]**, which means the inverse problem (no audio
at all) is a real penalty too. Both directions matter.

**Length.** Genuinely contested. TikTok's own small-business guide says in-feed
ads can run to 60s but **21–34s performs best** **[P-adjacent]**, while other
sources argue TikTok now rewards 1–3 minute videos *when completion holds*.
Treat length as a per-format band with a *reason*, and let the brand's own
calibration data override it (§6).

## 1.5 What we can measure afterwards (closing the loop)

| Platform | Available to us | Source |
|---|---|---|
| Instagram | `ig_reels_avg_watch_time` (Reels only; ms — **verify unit on a live call**), `ig_reels_video_view_total_time` (**"metric in development"**, may be unstable), views/reach/saves/shares | **[P]** Meta dev docs, updated 2026-06-18 |
| YouTube | `audienceWatchRatio`, **`relativeRetentionPerformance`**, `startedWatching`, `stoppedWatching` per `elapsedVideoTimeRatio`; `engagedViews` | **[P]** YouTube Analytics API |
| TikTok | account-level via our existing snapshot path; per-post retention is not exposed to third parties at our access tier | — |
| LinkedIn | impressions/engagement; no retention curve | — |

Hard constraints to design around:

- Meta insights **lag up to 48h**, and a **missing metric returns an empty
  dataset, not zero** — so the loop must treat absent and zero differently or it
  will learn from phantom failures.
- `instagram_manage_insights` scope is required; without it the endpoint 400s
  with error #10.
- Our current `AnalyticsSnapshot` model is **account-level daily**
  (followers/reach/impressions/engagement/views). **Per-post retention is not
  stored anywhere yet** — Phase 4 needs a new per-post metrics store.

**This is the asset.** Nobody can sell a credible content score without it, and
we already have the social connections, the publish path, and the per-post
analytics plumbing (`PostAnalyticsFor`, `components/contents/PostPerformance.tsx`).
The score→outcome loop is the moat, not the rubric.

---

# PART 2 — THE PLAN

## 2. Design principles

1. **Deterministic before probabilistic.** Anything checkable in code
   (word counts, durations, safe zones, bait phrases, IG's six deprioritizers)
   is checked in code — free, instant, zero variance, no tokens. The model only
   judges what genuinely needs judgement. This is exactly the division
   `design_validate.go` already makes against `designCraftInstructions`.
2. **Mirror the Design System architecture.** We already solved "give the AI a
   craft floor plus a per-brand identity that outranks it" for design. Reuse the
   shape, the precedence rule, and the file layout. No new concepts.
3. **Every point is attached to a fix.** A score with no "here is the line to
   change" is decoration. The UI surfaces the top 3 fixes, each wired to the
   existing `AIQuickEdit` path.
4. **One dimension per judge call.** Per the LLM-as-judge literature: a single
   prompt scoring five dimensions anchors on the first and bleeds it into the
   rest, producing correlated, unreliable scores. Score separately, aggregate in
   **code** with fixed weights.
5. **Low-precision sub-criteria, high-precision rollup.** Sub-criteria are
   binary or 3-point (the literature is explicit that 1–10 scales are unreliable
   without gold-set evidence the judge can use the resolution). The 0–100 the
   user sees comes from weighted arithmetic, not from asking a model for a
   number out of 100.
6. **The platform rules live in exactly one file per platform**, dated and
   confidence-tagged, so refreshing them is a 20-minute job rather than an
   archaeology project.

## 3. Knowledge architecture — four layers

```
┌─ L0  VIRALITY CRAFT CONTRACT ───────────────── code, const string ──┐
│  ai/virality_craft.go — the floor. Platform-agnostic, numeric.      │
│  Mirrors designCraftInstructions exactly, including precedence.     │
├─ L1  PLATFORM PLAYBOOKS ────────────────────── code, per platform ──┤
│  ai/virality_platforms.go — what each surface ranks on + hard       │
│  format rules + which CTA actually maps to its top signal.          │
│  Injected ONLY for the platforms this content targets.              │
├─ L2  PATTERN LIBRARY ───────────────────────── code, versioned ─────┤
│  ai/virality_patterns.go — hook archetypes, video structures,       │
│  share-trigger patterns, each with a when-to-use and an anti-use.   │
├─ L3  BRAND VIRALITY PROFILE ─────────── Firestore, LEARNED ─────────┤
│  brands/{id}/viralityProfile/main — what has actually worked for    │
│  THIS brand, derived from their own post analytics. Outranks L0–L2  │
│  wherever it has enough data to say something.                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Why L0–L2 are code, not Firestore.** Three reasons: (a) they are our editorial
IP and belong in review/PR, not in a console; (b) the `ai_config` precedent —
a Firestore doc that *replaces* a code registry is a trap we have already been
bitten by; (c) they change on the order of quarters, not days. L3 is Firestore
because it is per-brand and written by a job.

**Precedence, stated in the prompt itself** (not left to ordering, same as the
design blocks): `Brand Design System > L3 brand profile > L1 platform > L0 craft floor`.
L0 is the floor, never an override.

### 3.1 New files

| File | Contents |
|---|---|
| `backend-sls/internal/trendlyapis/ai/virality_craft.go` | L0 const, in the voice and format of `design_craft.go` |
| `backend-sls/internal/trendlyapis/ai/virality_platforms.go` | L1: per-platform block builder + a dated `SOURCES` comment with the [P]/[T] tags from Part 1 |
| `backend-sls/internal/trendlyapis/ai/virality_patterns.go` | L2 archetype library |
| `backend-sls/internal/trendlyapis/ai/script_validate.go` | deterministic checks + gate (sibling of `design_validate.go`) |
| `backend-sls/internal/trendlyapis/ai/virality_score.go` | the 5-dimension scorer + code rollup |
| `backend-sls/internal/models/trendlymodels/brand_virality_profile.go` | L3 model (sibling of `brand_design_system.go`) |
| `trendly-brands/components/contents/detail/ViralityPanel.tsx` | the score UI |
| `trendly-brands/components/contents/detail/virality-checks.ts` | the client mirror of the cheap deterministic checks, for instant feedback while typing |

### 3.2 Wiring into generation

`buildSystemPrompt` (`ai/context.go:42`) already assembles per-module prompts and
already appends `designCraftInstructions` for studio modules. The addition is
symmetric:

```go
// in buildSystemPrompt, for the content / script / strategy / calendar modules
if moduleHasVirality(module) {
    sb.WriteString(viralityCraftInstructions)              // L0
    sb.WriteString(platformPlaybookBlock(targetPlatforms)) // L1, targeted only
    sb.WriteString(viralityProfileBlock(loadViralityProfile(brandID))) // L3
}
```

`handleScriptGenWS` (`ai/content.go:269`) currently asks for
`## Hook (first 3 seconds) / ## Body (3-4 scenes with cues) / ## CTA` — which is
already the right skeleton, so the user-turn template barely changes. What
changes is that the system prompt now carries the standards, and the result is
**gated** on persist:

```go
OnDone: func(u *openrouter.Usage) {
    s := strings.TrimSpace(scriptBuf.String())
    if problems := validateScript(s, format, platforms); len(problems) > 0 {
        // same contract as design_validate: phrased as instructions, not diagnostics
        // → one bounded repair turn, then persist whatever we have
    }
    ...
}
```

Three further integration points, in increasing cost order:

1. **`score_content` tool** — the chat model can score the piece it is looking
   at and act on the result. This is what makes the AI "keep the factors in
   mind" conversationally rather than only at generation time.
2. **One-shot self-revision** — after generation, if the deterministic gate
   passes but the Hook dimension scores below a threshold, one bounded revise
   pass. Hard cap of one, metered, never a loop.
3. **Hook laddering** (`generate_hooks`) — produce 5 hooks for the same body,
   run the deterministic checks + Hook dimension on each, return them ranked.
   This is the highest value-per-token feature in the whole plan: the hook is the
   multiplicative gate, it is 15 words long, and 5 variants cost less than one
   script.

### 3.3 Model routing

Two new `openrouter.TaskType`s: **`TaskScore`** (judge; cheap+fast, no reasoning
budget, low temperature) and **`TaskHooks`** (reuses the `TaskScript` tier).

Add both to `AllTasks` **and** `defaultRegistry()` in `pkg/openrouter/models.go`.
`Resolve` already falls back to the built-in entry when the live `ai_config` has
no key for a task (and logs it), so a deploy that precedes a reseed will *not*
hard-lock the feature behind a fake upgrade prompt. Reseed `ai_config/tasks`
anyway so Firestore stays authoritative.

## 4. The deterministic layer (Phase 1)

Free, instant, zero-variance. It does double duty: it feeds the score *and* it
sets the hard caps. The client mirrors the cheap half for live feedback in the
editor; the backend is authoritative.

| # | Check | Rule | Severity | Source |
|---|---|---|---|---|
| D1 | Hook present | first block non-empty, ≤ 2 sentences | gate | [P] skip is a predicted negative |
| D2 | Throat-clearing | opener matches none of a greeting/intro phrase list | cap | [T] universal |
| D3 | Time-to-subject | subject or claim appears within ~first 2s of spoken script (words ÷ ~2.5 wps) | cap | [T] |
| D4 | Script ↔ duration | total words ÷ wps within ±20% of the target duration | gate | arithmetic |
| D5 | Scene text density | per-scene words ÷ scene duration ≤ readable rate; aligns with the existing "~0.3s per word of settled text" hold rule | warn | existing `design_craft.go` |
| D6 | Beat cadence | no gap > N seconds without a new scene/beat (N per format) | warn | [T] |
| D7 | CTA present and single | exactly one imperative action in the final block | cap | [P] |
| D8 | Engagement bait | no bait phrasing ("like if", "tag someone who", "comment YES") | cap | [P-historic] + [T] LinkedIn 2026 |
| D9 | Promise closed | hook's interrogative/claim keywords recur in the payoff block | warn | [T] |
| D10 | Muted-readable | on-screen text or captions present for each scene carrying an idea | warn | [P] IG deprioritises mostly-text **and** muted — both directions |
| D11 | Aspect + safe zones | 9:16; nothing material in top 14% / bottom 20% | gate | existing `design_craft.go` |
| D12 | IG deprioritizers | no watermark, not muted, not bordered, not mostly-text, not already posted | cap | **[P] stated by Instagram** |
| D13 | Duration band | inside the per-format band, with the reason shown | warn | [P-adjacent] TikTok 21–34s |
| D14 | Caption first line | hook restated/extended before the "more" fold | warn | [T] |
| D15 | Platform required fields | YT title, Reddit title+subreddit, LI visibility, per `ContentPlatformOptions` | gate | our own publish path |

Severities: **gate** = refuse to persist, hand the model an actionable
instruction (the `design_validate` contract). **cap** = persist, but ceiling the
overall score. **warn** = costs points in the relevant dimension only.

D15 partly overlaps the existing `publish-readiness.ts` / `use-publish-gate.ts`
— reuse those, do not re-implement.

## 5. The scoring rubric

### 5.1 Dimensions and weights

| Dimension | Weight | Question it answers | Grounded in |
|---|---|---|---|
| **Hook** | **30** | Will a scroller not skip in the first 1–3s? | [P] skip prediction; viewed-vs-swiped |
| **Body / Retention** | **25** | Does the middle hold them to the end? | [P] watch-through; `audienceWatchRatio` |
| **Payoff & Action** | **15** | Does the promise close, and is the one ask the right one? | [P] reshare #1 for Reels; saves for Explore |
| **Share Trigger** | **20** | Is there a reason to send this to a specific person? | [A] Berger & Milkman; STEPPS |
| **Platform & Craft Fit** | **10** | Format, length, captions, originality, per-platform fields | [P] IG's six deprioritizers |

Hook is weighted highest because it is the multiplicative gate. Share Trigger is
weighted above Payoff because stage 4 is the only compounding stage. Platform
Fit is weighted lowest *because most of it is deterministic and already gated* —
it should rarely be where points are lost.

The user asked for three segments — Hook, Body, Action. The UI shows exactly
those three as the headline bars; Share Trigger and Platform Fit render as two
secondary chips (§7). Internally all five are first-class.

### 5.2 Sub-criteria

Each is scored **0 / 1 / 2** (fail / partial / pass) in a single call per
dimension, with two anchor examples per boundary drawn from *real* Trendly
content — the literature is specific that anchors should sit on the boundary
between levels and be annotated with why.

**Hook (30)** — `H1` a specific claim, number or stake in the first sentence ·
`H2` the subject arrives before ~2s *(D3)* · `H3` opens a loop this video can
actually close · `H4` no throat-clearing *(D2)* · `H5` visual and verbal hook
agree, and frame 1 reads with sound off · `H6` written for a stranger, assumes
no prior context *(the mistake small accounts make most)*

**Body / Retention (25)** — `B1` one idea per scene · `B2` a new piece of
information at every beat, no dead restatement · `B3` beat cadence held *(D6)* ·
`B4` ordering earns the next second (the best material is neither dumped first
nor withheld to the end) · `B5` carries meaning muted *(D10)* · `B6` no scene
over its readable text budget *(D5)*

**Payoff & Action (15)** — `P1` the hook's specific promise is explicitly
closed *(D9)* · `P2` payoff lands before the final ~15%, not after the CTA ·
`P3` exactly one ask, and it is the action this surface actually ranks
(send/save on Reels and Explore, comment only where it is genuinely the signal,
follow almost never) *(D7)* · `P4` no bait phrasing *(D8)* · `P5` end frame
loops or hands off cleanly

**Share Trigger (20)** — `S1` social currency: sending it makes the sender look
informed, funny or early · `S2` high-arousal emotion present and nameable (awe /
anger / anxiety / humour) rather than low-arousal **[A]** · `S3` practical value:
one concrete, specific, usable takeaway · `S4` a nameable recipient — "this is so
you" · `S5` save-worthy: worth coming back to

**Platform & Craft Fit (10)** — `F1` duration band *(D13)* · `F2` aspect + safe
zones *(D11)* · `F3` none of IG's six deprioritizers *(D12)* · `F4` caption does
its own job *(D14)* · `F5` audio present / sound slot used · `F6` per-platform
fields correct *(D15)*

Sub-criteria marked *(Dn)* are **pre-filled from the deterministic layer** and
the model is told the answer rather than asked for it. That cuts both tokens and
variance, and it is why the judge prompt stays small.

### 5.3 Rollup

```
dimension  = 100 × Σ(sub_score) / (2 × sub_count)     # equal weight within a dimension
overall    = Σ(dimension × weight) / 100
```

Deliberately simple and fully inspectable: the user can be shown exactly why
they got 68, and we can change a weight without retraining anything.

### 5.4 Hard caps (the multiplicative correction)

```
if any `gate` check failed            → not scored at all; the gate speaks instead
if Hook < 40                          → overall capped at 55
if any `cap` check failed             → overall capped at 70
if Share Trigger == 0                 → overall capped at 75
```

Without these, a weighted average lets a fatal hook hide behind a strong body
and the number stops meaning anything. The cap is always *shown with its reason*
("capped at 55 — the hook is the gate; nothing downstream gets seen").

### 5.5 Bands

| Range | Label | Copy |
|---|---|---|
| 0–39 | Rework | A stranger will not stop for this |
| 40–59 | Weak | One or two fundamentals are missing |
| 60–74 | Publishable | Sound; the upside is in the hook |
| 75–89 | Strong | Follows what the platforms reward |
| 90–100 | Exceptional | Rare — check the fixes are real, not gamed |

### 5.6 Calibration (non-negotiable — this is what makes the number real)

Straight from the LLM-judge literature, all of which we should follow rather
than discover:

- **Gold set of 60–100 real posts** from Trendly brands with known outcomes,
  hand-scored per dimension by us.
- Measure per-dimension agreement with **Cohen's κ**. Target **κ ≥ 0.6**;
  **rewrite or drop any criterion that stays below 0.4.**
- Test for the known biases: order-swap, length control, position, verbosity,
  self-preference.
- **Pin the judge model version** and run a fixed canary set on a schedule. One
  audit found a same-family model upgrade shifted scores by up to 13% of the
  scale; scores must not be compared across judge versions without re-equating.
  Practically: **store `rubricVersion` + `judgeModel` on every score run**, and
  never plot two versions on one chart.
- Prefer **pairwise comparison** for the internal A/B work (more reliable than
  absolute scoring) even though the user-facing artifact is absolute.

## 6. Closing the loop (Phase 4 — the part competitors cannot copy)

1. Freeze the score snapshot onto the content at publish (`rubricVersion`,
   `judgeModel`, all five dimensions, the sub-criterion vector).
2. At **T+7d** and **T+28d**, pull per-post actuals: `audienceWatchRatio` /
   `relativeRetentionPerformance` (YouTube), `ig_reels_avg_watch_time` +
   saves/shares (Instagram), account-level deltas elsewhere. Respect the 48h lag;
   treat an empty dataset as *unknown*, never as zero.
3. Normalise against **the brand's own median**, not a global benchmark — a
   40-point retention lift on a 900-follower account is the signal; the absolute
   number is not.
4. Compute rank correlation per dimension. This produces two outputs:
   - **For the user:** "Your hooks score 82 but your 3-second hold is below your
     own median — the hook is testing well on paper and not in the feed." That
     sentence is worth the entire feature.
   - **For us:** per-brand weight tuning in L3, and evidence for whether a
     criterion earns its place at all.
5. Write the durable findings into L3 (`brands/{id}/viralityProfile/main`):
   best-performing hook archetypes, formats, lengths, cadence — which then feeds
   straight back into generation.

**Prerequisite:** a per-post metrics store. `AnalyticsSnapshot` is account-level
daily and cannot support this. New model + collection + indexes (§8).

## 7. UI

`components/contents/detail/ViralityPanel.tsx`, sitting with `ScriptEditor` in
the content detail; collapsed by default, with the overall number visible in the
`HandoffCard` row.

```
┌──────────────────────────────────────────────────────────┐
│  Virality score                         ╭─────╮          │
│  How closely this follows what the      │  74 │  Publish-│
│  platforms reward — not a prediction    ╰─────╯   able   │
│                                                          │
│  Hook    ████████░░  78     Body ██████░░░░ 62           │
│  Action  █████████░  85                                  │
│  Share ◐ 70   ·   Fit ● 90                               │
│                                                          │
│  Top fixes                                               │
│  → The hook assumes the viewer knows you    [Fix with AI]│
│  → Scene 3 restates scene 2                 [Fix with AI]│
│  → No reason to send this to someone        [Fix with AI]│
└──────────────────────────────────────────────────────────┘
```

- The subtitle carries the §0 framing permanently. **It is not a prediction**,
  and the UI says so where the number is, not in a footnote.
- A cap is shown as a reason line, never as a silent ceiling.
- Each fix is one tap into the existing `AIQuickEdit` path with the criterion as
  the focus — reusing the focus-prefix convention (`[Focused on: …]`).
- Deterministic checks run **client-side while typing** (`virality-checks.ts`)
  so the panel is never dead between scored runs and costs nothing to keep live.
- House rules: `fs()`/`lh()` on every size, `Colors(theme)` tokens only, shadows
  not borders, correct in both themes, `StyleSheet` at the bottom.

**Entitlements — enforced on both sides, per the standing rule.** Scoring burns
tokens, so: meter every run through `meterAIUsage`; free plan gets the
deterministic checks always (they are free) plus a small number of scored runs;
paid gets unlimited scoring plus hook laddering. Pre-empt on the frontend via
`useEntitlements()` — ambient meter, low/critical banner, in-context block with
an upgrade prompt and **no redirect** — and have the backend carry the
`tokens_exhausted` vs plan-lock `reason` so the panel reacts correctly. A gate
that only 402s is not done.

## 8. Data model, rules, indexes

```
brands/{brandId}/contents/{contentId}
  viralityScore: {               # latest run, embedded — no new collection, no index
    overall, hook, body, action, share, fit,
    cap?: { at, reason },
    subScores: { H1: 2, H2: 1, … },
    fixes: [{ criterion, severity, message, focus }],
    rubricVersion, judgeModel, scoredAt
  }

brands/{brandId}/viralityProfile/main          # L3, learned — mirrors designSystem/main
  hookArchetypes: [{ key, lift, n }]
  formatPerformance, durationBands, cadence,
  weightOverrides?, updatedAt, updatedBy

brands/{brandId}/postMetrics/{postId}          # Phase 4 — per-post actuals over time
  platform, publishedAt, contentId,
  samples: [{ at, views, reach, saves, shares,
              avgWatchTimeMs?, watchRatio?, relativeRetention? }]
  contentViralityScore                         # denormalised snapshot at publish
```

Per the standing rule, in the **same change**:

- `backend-sls/firestore/trendly/firestore.rules` — match blocks for
  `viralityProfile` (manager read, backend write) and `postMetrics` (manager
  read-only).
- Composite indexes in **both** `firestore.indexes.json` (Standard/dev) **and**
  `firestore.indexes.enterprise.json` (Enterprise/prod), kept identical:
  `postMetrics` on `(platform ASC, publishedAt DESC)` and
  `(contentId ASC, publishedAt DESC)`.
- `fieldOverrides` stays `[]` in the enterprise file. Any single-field index goes
  into `migrations/create-enterprise-single-field-indexes.sh` as a `gcloud` line.
- All Firestore access behind `trendlymodels` functions — no
  `firestoredb.Client` outside the models package.

## 9. Phasing

| Phase | What | Effort | Lands |
|---|---|---|---|
| **0** | L0 craft contract + L1 platform playbooks + L2 patterns, injected into content/script/strategy/calendar prompts | ~1 day | Every script the AI writes immediately improves. No new infra, no new collections, no UI, no tokens. |
| **1** | `script_validate.go` deterministic checks + gate + repair turn; client mirror for live feedback | 3–4 days | Structurally broken scripts stop reaching the user. Still free. |
| **2** | `virality_score.go` 5-dimension scorer, per-dimension calls, code rollup, caps; `ViralityPanel` + entitlement gating; `score_content` tool | ~1 week | The 0–100 the user asked for. |
| **3** | `generate_hooks` laddering + one-shot self-revision | 3–4 days | Highest value-per-token feature. |
| **4** | Per-post metrics store + score→outcome loop + per-brand calibration + L3 learning | 1–2 weeks | The number becomes evidence-backed and brand-specific. |

**Phase 0 is worth shipping on its own**, this week, regardless of what we decide
about the rest. It is a prompt-block change with no schema, no UI and no new
cost, and it addresses the actual complaint — that the AI writes content without
knowing what gets distributed.

### Acceptance criteria

- **P0** — a generated script for each of Reels/Shorts/TikTok/LinkedIn opens with
  no throat-clearing, states its subject in the first sentence, carries exactly
  one platform-appropriate CTA, and contains no bait phrasing. 10/10 samples.
- **P1** — every check in §4 has a unit test; a gate failure never persists; a
  repair turn is bounded to one; the client mirror agrees with the backend on
  every check it implements.
- **P2** — same input scores within ±4 overall across 5 runs at a pinned judge
  version; every dimension κ ≥ 0.6 on the gold set; every criterion below κ 0.4
  rewritten or dropped; caps display their reason; free-plan exhaustion shows the
  in-context block, not a redirect or a bare 402.
- **P3** — 5 hooks per call, ranked, deterministic checks applied to each,
  measurably better Hook scores than the single-shot baseline on a held-out set.
- **P4** — for a brand with ≥ 30 published pieces, a per-dimension correlation is
  computed against their own median and surfaced in words.

## 10. Risks

| Risk | Mitigation |
|---|---|
| **Score theatre** — a number users stop trusting after one flop | §0 framing in the UI itself; caps shown with reasons; Phase 4 makes it evidence-backed; never the word "prediction" |
| **Judge drift** on a model upgrade (documented at up to 13% of scale) | pin `judgeModel`, store it per run, canary set on a schedule, never chart two versions together |
| **Token cost** of scoring every keystroke | deterministic-first; cheap `TaskScore` tier; cache per script hash; score on demand and on publish, not on every edit |
| **Platform rules going stale** — half of Part 1 will be wrong within a year | one dated, confidence-tagged file per platform; refreshing is a contained job |
| **Optimising the wrong metric** — e.g. maximising comments and earning a bait demotion | bait is a scored *penalty*; CTA choice is per-surface and derived from [P] sources only |
| **Gaming** — users writing to the rubric rather than to the audience | Phase 4 correlation is the referee; a criterion that does not correlate gets dropped |
| **Over-trusting [T] numbers** | rubric rules come from [P]/[A] only; [T] informs defaults that calibration can override |

## 11. Open questions for you

1. **Name.** "Virality score" is what you asked for and what users will search
   for. It also slightly oversells. Options: keep it (and let the subtitle do the
   honest work, as above), or "Reach readiness", or "Hook score" for the headline
   with the rest as detail. My vote: **keep "Virality score", carry the honesty
   in the subtitle** — the alternatives are accurate and nobody will ask for them.
2. **Scope of v1 scoring** — video scripts only, or captions and carousels too?
   The rubric generalises (a carousel has a hook slide, body slides and a final
   slide; `design_craft.go` already says so), but Hook/Body/Action is cleanest on
   video. My vote: **video scripts in Phase 2, carousels in Phase 3.**
3. **Where scoring is triggered** — automatically on every generation, or on an
   explicit "Score this" tap? Automatic is a better product and costs tokens on
   content nobody will publish. My vote: **deterministic always-on (free),
   scored run on tap and automatically once at publish-time.**
4. **Is this one Notion ticket or a sequence?** Phases 0–1 and Phase 4 are very
   different sizes of work. My vote: **one epic with Phase 0+1 as the first
   ticket**, since Phase 0 can ship this week.
5. **Phase 4 depends on per-post retention**, and Instagram's
   `ig_reels_video_view_total_time` is marked "in development" while TikTok
   exposes no per-post retention at our tier. Worth confirming
   `relativeRetentionPerformance` actually populates for Shorts before we commit
   to the loop being YouTube-anchored.

---

## Appendix — sources and confidence

**[P] Platform documentation**
- Instagram, *Instagram Ranking Explained* — Reels/Feed/Explore/Stories predicted
  actions; the six Reels deprioritizers.
- TikTok, *Introduction to the TikTok recommendation system* (transparency centre)
  and *How TikTok recommends videos #ForYou* (newsroom) — pipeline, predicted
  interactions, follower count explicitly not a direct factor.
- YouTube Community post — "Shown in Feed" and "Viewed (vs. swiped away)".
- YouTube Analytics API, *Channel Reports* / *Metrics* —
  `audienceWatchRatio`, `relativeRetentionPerformance`, `engagedViews`, the
  Mar-2025 Shorts view-counting change.
- Meta, *Instagram Media Insights* (updated 2026-06-18) —
  `ig_reels_avg_watch_time`, `ig_reels_video_view_total_time` ("in development"),
  48h lag, empty-dataset behaviour.
- Meta Transparency Center, *Instagram Explore AI system* — watch-prediction
  ("more than 95% of a video") and like-prediction signals.
- TikTok for Business, *Video Advertising Guide* — 9:16, safe zones, 1080×1920,
  21–34s best-performing band.
- Facebook/Meta engagement-bait demotion (Dec 2017 announcement; current policy
  page not located — treat enforcement detail as [T] today).

**[A] Peer-reviewed**
- Berger & Milkman (2012), *What Makes Online Content Viral?*, Journal of
  Marketing Research — high-arousal emotion drives sharing; holds controlling for
  surprise/interest/practical utility; experimental causal evidence.
- *Pay Attention to Virality* (arXiv 1804.09949) — on the difficulty of
  pre-publication popularity prediction.
- LLM-as-judge literature on rubric design, scale precision, one-dimension-per-
  call, anchor construction, κ thresholds, bias controls, and version instability.
- Berger, *Contagious* (STEPPS) — trade book, not peer-reviewed, but the
  operational checklist behind the Share Trigger dimension.

**[T] Third-party, directional only — not hardcoded anywhere**
Completion-rate thresholds (~70%), rewatch benchmarks (15–20%), hook-rate bands
(55–75%), 3-second hold rates (60%), send-weight multipliers (3–5×), swipe-rate
cutoffs (30%/50%/70%), the "65% of viewers past 3s watch to 10s" Meta figure
(secondhand, original study not located), LinkedIn's 360Brew/dwell-time claims
and the March 2026 authenticity update, beat-cadence intervals (2–4s / 5–7s /
15–20s), the 85%-watched-on-mute figure.

**Known conflicts in the source material**, logged so nobody re-litigates them:
Reels maximum length (3 min vs 20 min); whether TikTok now favours short or
1–3 minute videos; whether watch time or swipe rate is the primary Shorts signal;
the hook window (1s vs 2s vs 3s).
