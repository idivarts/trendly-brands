# Plan: Contract Details UI Redesign (brands app)

**Status**: Reference implementation spec — use this when working on `ContractDetailContent.tsx` or the contract details screen.

**Migrated from**: `.cursor/plans/contract_details_ui_redesign_7be9c60f.plan.md`

---

## Goal

Update `components/contracts/ContractDetailContent.tsx` to match the web/mobile design:
- **Desktop (`xl`)**: Two-column layout — left column (primary content), right column (Members, info banner, Reviews & Ratings)
- **Mobile (`!xl`)**: Single column, existing order preserved
- All existing functionality and content preserved — nothing removed

---

## Design-to-Implementation Mapping

| Design element | Current location | Action |
|---|---|---|
| Header "Contract Details" + "View Profile" | `app/(main)/(drawer)/(secondary)/contract-details/[pageID].tsx` (ScreenHeader) | No change |
| Two cards top: video + profile image | Single Carousel/ScrollMedia | On `xl`: row with first attachment + influencer profile image card. On `!xl`: keep Carousel/ScrollMedia |
| Name + tagline + timestamp | Name + about + timestamp | Add tagline below name (`userData.profile?.content?.about` truncated) |
| APPLICATION DETAILS: Niche + Quote | Quote in UserResponse; no Niche | New section: two grey cards — Niche (`userData.profile?.category`) + Quote (`applicationData?.quotation`) |
| Campaign idea Q&A | UserResponse Q&A block | Keep `UserResponse` as-is; optional restyle as single card |
| Active Campaign card | Pressable to collaboration-details | Add "ACTIVE CAMPAIGN" tag, keep title + description + arrow |
| Contract Members list | MemberContainer ("Members") | Use MemberContainer; add optional `title` prop, pass `"Contract Members"` |
| Green info box | ActionContainer bottom block | Move to right column on `xl` via `slot` prop |
| Reviews & Ratings | ActionContainer feedback cards | Move to right column on `xl`; add "Reviews & Ratings" heading |

---

## Architecture (Two-Column + ActionContainer Split)

```
contract-details page
  ├── ScreenHeader
  ├── ContractDetailsContent
  │   └── xl: flex-row
  │       ├── Left column (60-70%)
  │       │   ├── Media row (first attachment + profile image card)
  │       │   ├── Profile + tagline + timestamp
  │       │   ├── ActionContainer slot="buttons"
  │       │   ├── Application Details (Niche + Quote)
  │       │   ├── UserResponse Q&A
  │       │   └── Active Campaign card
  │       └── Right column (30-40%)
  │           ├── MemberContainer title="Contract Members"
  │           └── ActionContainer slot="feedback-and-info"
  │               ├── "Reviews & Ratings" heading
  │               ├── Feedback cards (From Brand / From Influencer)
  │               └── Green info box
  └── Footer (optional, xl only)
```

Mobile (`!xl`): Single column — Media, Profile, full ActionContainer, MemberContainer, UserResponse, Active Campaign.

---

## Implementation Steps

### Step 1 — ActionContainer: add `slot` prop
**File**: `components/contracts/ActionContainer.tsx`

Add optional prop: `slot?: 'all' | 'buttons' | 'feedback-and-info'` (default `'all'`)

- `slot === 'buttons'`: render only status-based action buttons. No feedback cards, no green info box.
- `slot === 'feedback-and-info'`: render only the two feedback cards + green info box. Add "Reviews & Ratings" heading above feedback cards.
- `slot === 'all'` (default): current behavior unchanged.

**Important**: Keep a single component instance — one hook, one manager fetch. No duplicate fetches. The parent renders two `<ActionContainer>` instances (one per slot) but they share the same data query.

### Step 2 — MemberContainer: add optional `title` prop
**File**: `components/contracts/MemberContainer.tsx`

Add `title?: string` (default `"Members"`). Use for the section header text.

### Step 3 — ContractDetailContent: two-column layout + new sections
**File**: `components/contracts/ContractDetailContent.tsx`

- Use `useBreakpoints()` for `xl` / `width`
- Use `Colors(theme)` — all styles from theme tokens, zero hardcoded colors
- Single `StyleSheet.create(...)` (or `useMemo`-based styles) at the **bottom** of the file
- No inline style objects in JSX

**New — Top media row (xl only)**: When `xl` and attachments exist, render a flex-row: first attachment (or video placeholder with play icon) + influencer profile image card (`userData.profileImage`). When `!xl`, keep current Carousel/ScrollMedia.

**New — Tagline**: Below name, add one line from `userData.profile?.content?.about` or `socialMediaHighlight`, truncated. Fallback: `"—"`.

**New — Application Details section**: Only when `applicationData` present. Label: "APPLICATION DETAILS" (small uppercase grey). Two side-by-side cards on `xl`, stacked on `!xl`:
- **Niche**: `userData.profile?.category?.[0]` or joined array, or `"—"`
- **Quote**: `applicationData.quotation` + currency constant (reuse existing pattern)

### Step 4 — UserResponse: optional Q&A card styling
**File**: `components/contract-card/UserResponse.tsx`

No structural change required. Optionally wrap Q&A list in a card style if needed. Do not remove any content.

### Step 5 — Footer (optional)
**File**: `app/(main)/(drawer)/(secondary)/contract-details/[pageID].tsx`

If required by design: add small footer (xl only) — `"© 2024 Trendly Influencer Management Platform"`, centered, using theme text color.

---

## Files to Touch

1. `components/contracts/ActionContainer.tsx` — `slot` prop + conditional rendering
2. `components/contracts/MemberContainer.tsx` — optional `title` prop
3. `components/contracts/ContractDetailContent.tsx` — two-column layout, Application Details, media row, tagline, all styles in StyleSheet
4. `app/(main)/(drawer)/(secondary)/contract-details/[pageID].tsx` — optional footer
5. `components/contract-card/UserResponse.tsx` — optional card styling only if needed

---

## Data Sources

| Data point | Source |
|---|---|
| Niche | `userData.profile?.category` (array) — display first or join with " & " |
| Quote | `applicationData?.quotation` — format with app currency constant |
| Profile image | `userData.profileImage` |
| Tagline | `userData.profile?.content?.about` or `socialMediaHighlight`, first line |

---

## Responsive Summary

| Breakpoint | Layout |
|---|---|
| `xl` (desktop) | Two-column flex row; left ~65–70%, right ~30–35%; max-width constrained; media as two-card row; Niche + Quote side-by-side; ActionContainer split |
| `!xl` (mobile) | Single column; existing order and behavior; no structural change |

---

## Validation Checklist

- [ ] No content removed: attachments, message, Q&A, feedback cards, members list, info box, action buttons, active campaign link
- [ ] All existing props/callbacks unchanged: `refreshData`, `setFeedbackModalVisible`, `setAddMemberModal`, `updateMemberContainer`
- [ ] Navigation to collaboration-details still works
- [ ] AddMembersModal and FeedbackModal still open correctly
- [ ] Zero hardcoded colors — all from `Colors(theme)`
- [ ] Light and dark themes both look correct
- [ ] StyleSheet at bottom of file, no inline style objects
