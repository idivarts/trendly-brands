# Content Calendar — Backend API Plan

This document lists every backend API endpoint needed to make the Content Calendar fully functional. The UI currently runs entirely on mock data (`mock-data.ts`). All API calls below are placeholders pending backend implementation.

---

## Data Model: `CalendarItem`

```ts
{
  id: string;          // Firestore doc ID
  brandId: string;     // owning brand
  title: string;       // short content title
  idea: string;        // vision / description
  date: string;        // ISO date "YYYY-MM-DD"
  type: "reel" | "post" | "story" | "carousel" | "live";
  comments?: Comment[]; // inline change-request notes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Comment {
  id: string;
  text: string;
  authorId: string;
  createdAt: Timestamp;
}
```

Suggested Firestore path: `brands/{brandId}/calendarItems/{itemId}`

---

## Required Endpoints

### 1. List calendar items for a brand

```
GET /api/v2/calendar/items?brandId={brandId}&from=YYYY-MM-DD&to=YYYY-MM-DD
```

**Query params:**
- `brandId` — the brand's Firestore ID
- `from` / `to` — inclusive ISO date range (fetch by displayed month/week)

**Response:** `{ items: CalendarItem[] }`

**Frontend hook:** Called on mount and whenever the displayed month/week changes.

---

### 2. Create a calendar item

```
POST /api/v2/calendar/items
Body: { brandId, title, idea, date, type }
```

**Response:** `{ item: CalendarItem }`

**Frontend hook:** Called on `AddContentModal` submit (`onAdd` callback in `ContentCalendarScreen`).

---

### 3. Update a calendar item

```
PATCH /api/v2/calendar/items/{itemId}
Body: Partial<{ title, idea, date, type }>
```

**Response:** `{ item: CalendarItem }`

**Frontend hook:** Future — edit mode on `ContentItemChip`.

---

### 4. Delete a calendar item

```
DELETE /api/v2/calendar/items/{itemId}
```

**Response:** `{ ok: true }`

**Frontend hook:** Swipe-to-delete or context menu on `ContentItemChip`.

---

### 5. Add a comment to an item

```
POST /api/v2/calendar/items/{itemId}/comments
Body: { text: string }
```

**Response:** `{ comment: Comment }`

**Frontend hook:** Called on `QuickCommentModal` submit (`onSubmit` callback). Currently the submit is a no-op TODO.

---

### 6. AI chat — calendar context

The AI chat panel currently mocks responses. The real endpoint should accept:

```
POST /api/v2/calendar/ai-chat
Body: {
  brandId: string;
  message: string;
  focusItemIds: string[];   // IDs of items pinned as context
  history: { role: "user" | "assistant", content: string }[];
}
```

**Response (streaming or batch):** `{ reply: string; suggestedEdits?: Partial<CalendarItem>[] }`

The backend should use an OpenAI/Gemini prompt trained as a "Social Media Content Expert" specialised for Indian D2C brands.

---

### 7. Seal strategy → calendar (future)

When the user clicks **"Seal → Calendar"** from the Content Strategy screen, the AI-generated strategy should be parsed and converted into `CalendarItem` entries:

```
POST /api/v2/calendar/seal-strategy
Body: { brandId: string; strategyId: string; startDate: string }
```

**Response:** `{ items: CalendarItem[] }` — the newly created items.

---

## Lambda to extend

All calendar routes should be added to the **`trendly_v2`** Lambda (`functions/trendly_v2/main.go`) under the `/api/v2/calendar` prefix, following the same Gin handler + Firestore pattern used by `internal/trendlyapis/user.go` and `internal/trendlyapis/brand.go`.

Firestore collection is new — no migration needed; just start writing to `brands/{brandId}/calendarItems`.
