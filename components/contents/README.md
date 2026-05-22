# Content List + Generator — Backend API Plan

This document outlines the backend APIs needed to make the Content module fully functional.
All routes should sit under the `trendly_collabs` or a new `trendly_content` lambda.

---

## Data Model — `ContentItem`

```
ContentItem {
  id          string          // auto-generated
  brandId     string          // brand the content belongs to
  title       string
  idea        string
  date        string          // ISO date YYYY-MM-DD (planned posting date)
  type        ContentType     // "reel" | "post" | "story" | "carousel" | "live"
  status      ContentStatus   // "draft" | "review_pending" | "approved"
  caption     string?
  hashtags    string?
  timeOfPosting string?       // HH:MM
  script      string?         // reel script
  imagePrompt string?         // image generation prompt
  isArchived  bool
  createdAt   timestamp
  updatedAt   timestamp
  calendarItemId string?      // if created from a calendar entry
}
```

---

## REST Endpoints

### 1. List Content
```
GET /api/content?brandId=<brandId>&archived=<bool>
```
- Returns all content items for a brand, filtered by `isArchived`
- Supports pagination: `?limit=20&cursor=<lastId>`

### 2. Get Single Content Item
```
GET /api/content/:contentId
```

### 3. Create Content Item
```
POST /api/content
Body: { brandId, title, idea, date, type }
```
- Creates a new content item with status = "draft"
- Optionally accepts `calendarItemId` to link to a calendar entry

### 4. Update Content Item
```
PATCH /api/content/:contentId
Body: Partial<ContentItem> — any updatable fields
```
- Updates title, idea, date, status, caption, hashtags, timeOfPosting, script, imagePrompt

### 5. Archive / Unarchive
```
PATCH /api/content/:contentId/archive
Body: { isArchived: bool }
```

### 6. Delete Content Item
```
DELETE /api/content/:contentId
```

---

## AI Endpoints

### 7. Generate Caption
```
POST /api/content/:contentId/ai/caption
Body: { prompt: string, draft?: string }
Returns: { caption: string }
```
- Calls OpenAI/Gemini with brand context + user prompt
- If `draft` provided, enhances it; otherwise generates from scratch

### 8. Generate Hashtags
```
POST /api/content/:contentId/ai/hashtags
Body: { prompt: string }
Returns: { hashtags: string }
```

### 9. Enhance Reel Script
```
POST /api/content/:contentId/ai/script
Body: { prompt: string, currentScript?: string }
Returns: { script: string }
```
- Enhances or rewrites the reel script based on the prompt

### 10. Generate Image (for posts/carousels)
```
POST /api/content/:contentId/ai/image
Body: { prompt: string, variation?: number }
Returns: { imageUrl: string, generationId: string }
```
- Calls image generation API (e.g. DALL·E or Stability AI)
- Returns a pre-signed S3 URL for the generated image

---

## Collab Integration

### 11. Create Collab from Reel Content
```
POST /api/content/:contentId/create-collab
```
- Takes the content item's title, idea, and script
- Pre-populates a new collaboration in `trendly_collabs`
- Returns `{ collaborationId }`

---

## Firestore Collection
- Primary store: `brands/{brandId}/content/{contentId}`
- Or a top-level `content` collection with `brandId` field for easier querying

---

## Notes
- The `calendarItemId` field links content to the calendar planning stage; fetching a calendar item should optionally include its linked content status.
- AI generation calls should be async (return a jobId) for script/image generation since they can be slow; caption and hashtag generation can be synchronous.
