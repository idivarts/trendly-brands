# Content Strategy — Backend API Requirements

## Overview

The Content Strategy feature is a two-phase AI-driven flow:

1. **Strategy Creation**: User answers guided questions → AI generates a base strategy
2. **Strategy Editing**: User refines the strategy via a rich editor and chatbot collaboration

---

## Endpoints Needed

> **⚠️ Updated 2026-06-05 — endpoints #1–#8 are SUPERSEDED.** The strategy chat,
> session, generation, quick-edit and CRUD flows are now served by the shared
> **OpenRouter AI chat engine**, not bespoke `/api/content-strategy/*` routes:
> - **Chat / create / edit:** WebSocket (live typing only) + a direct Firestore
>   subscription to `ai_conversations` for the thread list and message history
>   (Firestore is the source of truth; first load + pagination are subscriptions,
>   not backend GETs). Writes go through `POST/DELETE/PATCH /api/ai/conversations`
>   with `module="strategy"` and `contextId={strategyId}`. The AI collects the brief
>   conversationally and writes the doc via the `set_strategy_brief` /
>   `generate_strategy_doc` / `apply_strategy_edit` server tools
>   (`backend-sls/internal/trendlyapis/ai/strategy_tools.go`).
> - **Quick edit (direct text enhancement):** `POST /api/ai/quick-edit`.
> - **List / CRUD:** the apps read/write `brands/{brandId}/strategies/{id}`
>   directly via the `useStrategies` hook + Firestore.
>
> Only **#9 push-to-calendar** and **#10 recheck-duration** are live HTTP
> endpoints (implemented in `strategy_routes.go`, registered under
> `/api/content-strategy`). They now require `brandId` in the request body.
> The document body is stored as **HTML** in `markdownContent` (the field name
> is historical), not Markdown.

### 1. Start a Strategy Session

**POST** `/api/content-strategy/session`

Creates a new session and returns the first AI question.

**Request:**
```json
{
  "brandId": "string",
  "initialPrompt": "string"
}
```

**Response:**
```json
{
  "sessionId": "string",
  "nextQuestion": "string",
  "questionIndex": 0
}
```

---

### 2. Send a Chat Message / Answer

**POST** `/api/content-strategy/session/:sessionId/message`

Sends the user's answer and returns the next question or triggers strategy generation.

**Request:**
```json
{
  "message": "string",
  "attachment": "string | null"
}
```

**Response:**
```json
{
  "reply": "string",
  "questionIndex": 1,
  "readyToGenerate": false
}
```

When `readyToGenerate: true`, the UI transitions to the shimmer/loading state and polls the generation endpoint.

---

### 3. Generate Strategy

**POST** `/api/content-strategy/session/:sessionId/generate`

Triggers AI strategy generation based on gathered context. Long-running — can be polled via status endpoint or use async callback.

**Response:**
```json
{
  "strategyId": "string",
  "status": "generating | complete | failed"
}
```

---

### 4. Get Strategy

**GET** `/api/content-strategy/:strategyId`

Returns the full strategy content and metadata.

**Response:**
```json
{
  "id": "string",
  "brandId": "string",
  "title": "string",
  "content": "string",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

---

### 5. Update Strategy Content

**PATCH** `/api/content-strategy/:strategyId`

Saves edits made in the strategy editor.

**Request:**
```json
{
  "content": "string",
  "title": "string?"
}
```

---

### 6. Quick Edit (AI-Assisted)

**POST** `/api/content-strategy/:strategyId/quick-edit`

Takes selected text + a prompt and returns AI-rewritten text.

**Request:**
```json
{
  "selectedText": "string",
  "prompt": "string"
}
```

**Response:**
```json
{
  "result": "string"
}
```

---

### 7. Chat on Existing Strategy

**POST** `/api/content-strategy/:strategyId/chat`

Sends a message to the chatbot for an existing strategy. Chatbot has context of the strategy content.

**Request:**
```json
{
  "message": "string",
  "attachment": "string | null"
}
```

**Response:**
```json
{
  "reply": "string"
}
```

---

### 8. List Strategies for Brand

**GET** `/api/content-strategy?brandId=:brandId`

Returns all strategies for a brand (for the strategies drawer).

**Response:**
```json
{
  "strategies": [
    {
      "id": "string",
      "title": "string",
      "createdAt": "ISO8601"
    }
  ]
}
```

---

### 9. Push Strategy to Calendar

**POST** `/api/content-strategy/:strategyId/push-to-calendar`

Expands the finalized strategy into scheduled calendar content items. Triggered from
the strategy toolbar's overflow menu → **Push to Calendar**, after the user confirms
the start date and override behaviour in `PushToCalendarModal`.

The calendar window runs from `startDate` for `durationDays` days (inclusive of the
start day). `durationDays` is the campaign-window length fixed when the strategy was
created (`IStrategy.timeline.endDate − startDate`); if the strategy has no timeline,
the UI sends a default of `30`.

**Request:**
```json
{
  "brandId": "string",            // owning brand (the strategy lives under brands/{brandId})
  "startDate": "2026-06-01",      // YYYY-MM-DD — first day the strategy occupies
  "durationDays": 30,             // window length in days (inclusive of startDate)
  "overrideExisting": false       // see behaviour below
}
```

**`overrideExisting` behaviour:**
- `false` (**Keep existing** — default): new content items are added *alongside* any
  items already scheduled within `[startDate, startDate + durationDays)`. Nothing is
  deleted.
- `true` (**Replace existing**): all existing calendar items whose date falls within
  `[startDate, startDate + durationDays)` are deleted first, then the strategy fills
  the window.

**Response:**
```json
{
  "strategyId": "string",
  "createdItemIds": ["string"],   // calendar items generated by this push
  "removedItemIds": ["string"],   // items deleted when overrideExisting = true (else [])
  "startDate": "2026-06-01",
  "endDate": "2026-06-30"
}
```

**Notes:**
- Generated items should populate the brand's `contents` subcollection (the same source
  the content calendar reads via `useContents`), each carrying a `date` and a back-ref
  to `strategyId`.
- After a successful response the UI navigates to the content calendar focused on the
  `startDate` month (`?focusDate=YYYY-MM-DD`).
- Consider making this idempotent / safe to re-run (e.g. tag generated items with
  `strategyId` so a re-push can clean up its own prior output).

---

### 10. Re-check Strategy Duration

**POST** `/api/content-strategy/:strategyId/recheck-duration`

Re-derives the campaign length by having the AI re-read the current strategy body.
Used inside `PushToCalendarModal` when the user has manually edited the strategy and
the duration recorded at creation (`IStrategy.timeline`) may no longer match what the
document actually describes.

The endpoint should re-analyse `markdownContent`, extract the intended run length,
and **persist** the corrected window back to `IStrategy.timeline` (so subsequent reads
and the push-to-calendar step use the fresh value).

**Request:**
```json
{
  "brandId": "string"   // owning brand; the server reads the stored strategy content
}
```

**Response:**
```json
{
  "strategyId": "string",
  "durationDays": 45,        // corrected campaign length, in days
  "confidence": 0.0          // optional 0–1 — how clearly the doc stated a length
}
```

**Notes:**
- Return `durationDays: null` (or omit it) if the AI can't find a clear length; the UI
  shows a "couldn't read a length" toast and leaves the current value untouched.
- The frontend applies the returned `durationDays` to the modal immediately (it takes
  precedence over the value recorded at creation) and recomputes the end date.

---

## Data Model (Firestore)

```
content_strategies/
  {strategyId}/
    brandId: string
    sessionId: string
    title: string
    content: string        // Markdown text
    chatMessages: []       // Array of {sender, text, timestamp}
    createdAt: Timestamp
    updatedAt: Timestamp
    status: "draft" | "sealed"
```

---

## AI Integration Notes

- AI runs through **OpenRouter** (`pkg/openrouter/`), not Gemini. The strategy
  conversation uses the `strategy` module (system prompt + tools in
  `internal/trendlyapis/ai/`); `TaskStrategy` resolves to Claude Opus.
- The system prompt already injects the brand profile and the existing strategy
  doc (`internal/trendlyapis/ai/context.go → loadModuleContext`).
- Create + edit happen via server tools that write `markdownContent` directly and
  reset the Yjs CRDT (`crdtInitialized=false` + prune `yupdates`) so a live web
  editor re-bootstraps from the new HTML.
- push-to-calendar / recheck-duration parse the strategy HTML with a JSON-mode
  OpenRouter call and map the result into `brands/{brandId}/contents`.

---

## Document Format

The strategy body is stored and edited as **HTML** in the `markdownContent`
field (the field name is historical — it does **not** hold Markdown). The web
editor is Lexical (with Yjs real-time collaboration); native is a single-writer
HTML editor. AI generation and edits emit semantic HTML, and push-to-calendar
parses HTML — they must all agree on this format.
