# Trendly AI Content Studio — Research Plan & Product Spec

**Author:** Rahul Sinha  
**Date:** May 25, 2026  
**Status:** Draft

---

## 1. What We're Trying to Build

An AI content aggregator embedded inside Trendly — specifically designed for brand marketers running influencer campaigns. Think use.ai (multi-model workspace) but purpose-built for the Trendly workflow: creating collaboration briefs, generating content guidelines for influencers, reviewing deliverables, and drafting social-ready copy — all within the platform where the campaign is already being managed.

This serves **both sides of the marketplace**: brand marketers get AI-powered brief creation, campaign strategy, caption generation, and performance insights; influencers/creators get AI-assisted video scripts, caption drafts, and content ideation — all within the platform where their campaign is already being managed.

The core insight is that brand marketers and influencers currently context-switch between Trendly and external tools like ChatGPT, Jasper, or Buffer to write briefs, captions, and scripts. This AI layer collapses that workflow back into Trendly.

---

## 2. What Trendly Already Has (Codebase Audit)

Before building, it's critical to know what infrastructure already exists.

**Existing AI infrastructure in `backend-sls`:**
- `pkg/gemini/` — Gemini client is initialized and ready to use
- `pkg/myopenai/` — OpenAI assistant client is live, used for influencer-collab evaluation
- `internal/matchmaking/` — AI matchmaking job (cron Lambda) uses OpenAI + Gemini to match influencers to collaborations
- `internal/openai/collaboration/` — collab evaluation and schema exist; Claude can generate content strategy prompts using the same pattern

**Existing UX surfaces where AI assist plugs in naturally:**
- `trendly-brands/app/(main)/(drawer)/(secondary)/(modal)/create-collaboration.tsx` — collab creation modal; an AI "generate brief" button fits here
- `trendly-brands/app/(main)/(drawer)/(secondary)/collaboration-cms.tsx` — cross-campaign kanban view; AI caption review or batch generation fits here
- `trendly-brands/app/(main)/(drawer)/(secondary)/brand-crm.tsx` — CRM kanban; AI-generated outreach copy fits here
- Deliverables flow (`monetize/deliverable.go`) — AI-assisted review of influencer-submitted content

**What's missing:**
- No user-facing AI generation endpoint (all current AI is backend-only, for matchmaking)
- No multi-model routing layer for brand users
- No dedicated AI workspace UI in `trendly-brands`

---

## 3. Competitive Landscape

### use.ai
A multi-model AI workspace that routes prompts to GPT-4o, Claude, Gemini, and others from a single interface. Core pattern: unified chat with model switcher, team shared history, and file context. Not domain-specific — it's a horizontal tool.

**What Trendly can do better:** context-aware AI. Trendly knows the collaboration brief, the influencer's niche, their past performance data (from `trendlyrdb/influencers.go`), and the brand's campaign history. An AI assistant inside Trendly can pre-load all of this context automatically — something a general-purpose tool like use.ai can't do.

### Buffer AI Assistant
Handles ideation, drafting, scheduling, and cross-channel analytics in one platform. Strong on social media copy generation and scheduling. Buffer's AI is deeply integrated into the publishing workflow.

**Key learning:** AI works best when it's inside the workflow, not bolted on.

### Jasper
Enterprise-grade AI content generation with brand voice training, templates (ads, captions, product descriptions), and team collaboration. Expensive. Strong on consistent brand voice.

**Key learning:** Brand voice consistency matters to D2C brands. We should let brands define their tone/voice once and have the AI remember it.

### Market context
- 82% of marketers now use AI tools daily (2025 Salesforce survey)
- AI tools save marketers an average of 5 hours/week on content tasks
- 92% of brands plan to use AI for influencer campaign execution by end of 2026
- Influencer marketing market: $32.55B in 2025
- AI content tools speed up campaign production by up to 60%

---

## 4. User Research Plan

### 4.1 Research Objectives

1. Understand where brand marketers lose the most time in the current Trendly + external tool workflow
2. Validate whether AI content assist should be embedded in the collab creation flow, the CMS, or both
3. Discover what "good" AI output looks like for a D2C brand manager (brief quality, caption style, brand voice)
4. Identify which AI capabilities would drive the most value: brief generation, caption writing, influencer content review, or performance insights
5. Test willingness to pay / perceived value relative to current Trendly subscription tiers

### 4.2 Research Method

**Primary: User interviews** — 6 brand managers currently active on Trendly, mix of solo managers and agency-style users. 45-minute sessions. Goal: deep understanding of current workflow, frustrations, and mental model of AI.

**Secondary: Lightweight usability test** — once a prototype (Figma or working build) is ready, 5 sessions testing the in-app AI assist in the collab creation flow.

**Timeline:** 2 weeks for recruitment + interviews, 1 week for synthesis, 1 week for prototype test.

### 4.3 Participant Criteria

- Active Trendly brand account (at least 2 live collaborations in the past 60 days)
- Responsible for writing collaboration briefs themselves (not delegated entirely)
- Mix of industries (fashion, F&B, beauty, lifestyle)
- At least one participant who has tried ChatGPT or another AI tool for marketing tasks

### 4.4 Interview Discussion Guide

**Warm-up (5 min)**

- Walk me through how you run a typical influencer collaboration from start to finish.
- What does your week look like on a busy campaign launch week?

**Current workflow deep dive (15 min)**

- Take me through the last collaboration brief you wrote. What did you write? Where? How long did it take?
- What makes a brief good, in your view? What does a bad brief look like — what happens when influencers receive one?
- After you accept an influencer's application, what do you do to communicate your expectations to them?
- When an influencer submits a deliverable, how do you decide whether to approve or ask for revisions?
- What tools outside of Trendly do you use to get your campaign content work done?

**AI tool usage (10 min)**

- Have you ever used AI tools like ChatGPT, Claude, or Jasper for marketing work? Tell me about it.
- What did you use it for? What worked, what didn't?
- Is there anything you tried to do with AI that just didn't work for you?
- When you imagine an AI assistant built specifically for influencer marketing, what does it do?

**Concept reaction (10 min)** *(use a simple wireframe or verbal description)*

- "Imagine when you're creating a collaboration on Trendly, there's an 'AI Generate' button next to the brief field. You click it, and it drafts a brief for you based on your brand profile and the campaign goal. What's your reaction to that?"
- What would you change about what I just described?
- "There's also a view where you can ask the AI any question — 'Write me 3 Instagram caption options for this campaign,' 'Help me review this deliverable,' 'What type of influencer works best for a Diwali campaign?' Would you use this? What would you ask first?"

**Wrap-up (5 min)**

- If this feature existed today, what would make you trust it enough to actually use it?
- What would make you stop using it?
- Is there anything I didn't ask about that you think is important?

### 4.5 Analysis Framework

After interviews, use affinity mapping to cluster insights into themes:

- **Pain points**: time sinks, errors, manual steps that should be automated
- **Mental models**: how brand managers think about brief quality, influencer communication, content review
- **AI readiness**: comfort level with AI, trust triggers, trust breakers
- **Feature ranking**: which AI capabilities surfaced most frequently and with strongest emotional weight
- **Jobs to be done**: what are they hiring AI to do? (save time? ensure consistency? get unstuck?)

---

## 5. Product Architecture Plan

### 5.1 What to Build (Feature Set)

**Phase 1 — AI Assist inline (4 weeks)**
Lowest friction, highest-value entry point. Add AI generation buttons within existing screens, no new tab required.

- AI brief + content strategy generator in `create-collaboration.tsx`: "Generate brief" → pre-fills the brief using brand name, campaign goal, niche, and product from form context; also suggests content strategy angle ("Unboxing vs. Day-in-the-life vs. Tutorial")
- AI caption suggestions in `collaboration-cms.tsx`: for each live contract, a "Generate captions" action producing 3 Instagram caption variants the brand can share with the influencer
- Powered by: OpenAI GPT-4o via existing `pkg/myopenai/` client

**Phase 2 — AI Content Studio tab (8 weeks)**
Standalone workspace, modeled on use.ai's multi-model pattern but purpose-built for influencer marketing.

- New tab in `trendly-brands` drawer: "AI Studio"
- New screen: `trendly-brands/app/(main)/(drawer)/(secondary)/ai-studio.tsx`
- Chat interface with context-loaded sidebar: active campaigns, influencer profiles, past posts
- Multi-model routing (user-selectable or auto):
  - GPT-4o → caption generation, brief writing, strategy
  - Gemini → multimodal analysis (review submitted video thumbnails, analyze post images)
  - Claude (Anthropic API) → long-form strategy documents, brand voice analysis
  - DALL-E 3 / Imagen 3 → AI image generation for mood boards, reference images for influencers
- Video script generation: given a collab brief + influencer niche → produce a structured video script (hook, body, CTA) in multiple formats (Reel, YouTube Short, TikTok)
- Performance insights assistant: ask questions like "Which niches performed best for my last 5 campaigns?" — AI reads from brand's contract/collaboration history and answers in natural language
- Brand voice: brands describe tone once ("Fun and quirky, never corporate") → saved to Firestore brand profile → auto-injected into every prompt

**Phase 3 — Influencer-side content assist (4 weeks)**
Extend AI to the `trendly-users` (influencer app) side.

- AI caption + video script generator in deliverable submission flow: influencer gets AI-generated caption options and a script outline based on the collab brief before uploading
- "Help me write my application" button in `apply-now/[pageID].tsx` — AI pre-fills the pitch based on the collab description
- Content ideation: "Give me 5 content ideas for this collaboration" button on collab detail screen

### 5.2 Technical Architecture

**New backend Lambda (or extend `trendly_collabs`):**

```
POST /api/ai/content/generate
{
  "type": "brief" | "caption" | "strategy" | "review",
  "collaborationId": "...",    // optional — loads full collab context
  "brandId": "...",
  "prompt": "...",
  "model": "gpt-4o" | "gemini" | "claude"   // optional; default auto-selected by type
}
```

**Model routing logic:**
- `brief` → GPT-4o (structured output, follows instructions well)
- `caption` → GPT-4o or Claude (creative, tone-adherent)
- `video_script` → Claude (long-form, structured narrative)
- `strategy` → Claude (long-form, reasoning-heavy)
- `review` (analyze image/video deliverable) → Gemini (multimodal)
- `image_gen` → DALL-E 3 (brand mood boards, reference images)
- `performance_insights` → GPT-4o with function calling against brand's collab/contract history
- Default routing: cheapest capable model per task type; users can override in AI Studio tab

**Context injection pattern** (extends existing matchmaking approach):

```go
systemPrompt := fmt.Sprintf(`
You are an AI assistant for %s, a %s brand on Trendly.
Brand voice: %s
Active campaign: %s — targeting %s influencers in the %s niche.
`, brand.Name, brand.Industry, brand.AIVoice, collab.Name, collab.TargetFollowerRange, collab.Niche)
```

**New Firestore fields on Brand model:**
- `AIVoice string` — brand's described tone/voice
- `AIPreferences map[string]string` — per-model preferences

**Frontend pattern:**
- Shared hook: `useAIGenerate(type, context)` → calls `/api/ai/content/generate`
- Loading states: skeleton shimmer while streaming
- Output: editable text area pre-filled with AI output; user edits before using

### 5.3 UX Placement Map

```
trendly-brands drawer
├── (tabs)
│   ├── collaborations.tsx          → "AI Assist" badge on collab cards
│   ├── discover.tsx                → (Phase 3) AI-powered search filters
│   └── messages.tsx                → (Phase 3) AI draft reply
├── (secondary)
│   ├── create-collaboration.tsx    → Phase 1: "Generate brief" button
│   ├── collaboration-cms.tsx       → Phase 1: "Generate captions" per contract
│   ├── ai-studio.tsx               ← NEW Phase 2: full AI workspace
│   ├── brand-profile.tsx           → Phase 2: "Set your brand voice" field
│   └── contract-details/[pageID]   → Phase 2: AI deliverable review assist
```

### 5.4 Phased Roadmap

| Phase | Scope | Who | Timeline | Success Metric |
|---|---|---|---|---|
| 1 | Inline AI assist (brief, caption, content strategy) | Brands | 4 weeks | 30%+ of brand users click AI button at least once in first 2 weeks |
| 2 | AI Studio tab (multi-model, image gen, video scripts, performance insights, brand voice) | Brands | 8 weeks | 20%+ weekly active users of AI Studio; avg brief time reduced by 40% |
| 3 | Influencer-side AI (captions, video scripts, application assist) | Influencers | 4 weeks | Increase in influencer application quality score (rated by brands) |

---

## 6. Acceptance Criteria

**Phase 1:**
- AI brief generator produces relevant, brand-voice-aware output in < 3 seconds
- Output is editable before saving — AI never auto-saves without user confirmation
- Works on both mobile and web (React Native + Expo web)
- Backend: new endpoint with Firebase auth middleware, rate-limited to 50 requests/brand/day (Phase 1)

**Phase 2:**
- AI Studio tab loads brand context (active collabs, brand voice) on first render without additional user input
- Multi-model routing selects the right model per task type automatically
- Brand voice setting persists across sessions (stored in Firestore)
- Zero cost leakage: all AI calls are authenticated and brand-scoped

**Phase 3:**
- Influencer-side AI does not expose brand-proprietary data to other influencers
- AI-generated application text is clearly labeled as AI-assisted in the brand's view

---

## 7. Open Questions for Research

These should be resolved through interviews before finalizing Phase 2 architecture:

1. Do brand managers want to see which AI model generated a response, or does the model abstraction actually help?
2. How much do brands trust AI to review influencer deliverables? Is "AI says approve" a help or a liability concern?
3. Is there demand for team-shared AI history (multiple managers seeing same brand's AI conversation), or is individual use sufficient for Phase 2?
4. What's the right pricing model — bundled into existing subscription tiers, or a separate AI add-on?

---

*Next step: Begin participant recruitment for interviews using the criteria in Section 4.3. Target 6 brand managers, scheduling to begin week of June 1, 2026.*
