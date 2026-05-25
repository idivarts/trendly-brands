# Content Strategy — Backend API Requirements

## Overview

The Content Strategy feature is a two-phase AI-driven flow:

1. **Strategy Creation**: User answers guided questions → AI generates a base strategy
2. **Strategy Editing**: User refines the strategy via a rich editor and chatbot collaboration

---

## Endpoints Needed

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

### 9. Seal Strategy → Calendar

**POST** `/api/content-strategy/:strategyId/seal`

Converts the finalized strategy into calendar events. Implementation TBD (referenced in ticket as "coming next").

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

- Use **Gemini** (already integrated in `pkg/gemini/`) for question generation and strategy creation
- System prompt should include: brand profile, niche, and previous collab history
- Quick Edit and Chat endpoints should include the current strategy content in context
- Token cost is high — consider caching the base strategy generation

---

## Markdown Format

The strategy content is stored and edited as **Markdown**. The frontend currently uses a plain text editor for the scaffold. Replace with a proper markdown editor library (e.g. `react-native-pell-rich-editor` storing HTML, or a web-native editor like Tiptap via Expo web) before production.
