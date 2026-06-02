# Inbox feature (trendly-brands)

Omni-channel Inbox for brands — read & reply to **DMs and comments** across
connected **Instagram** and **Facebook** accounts. Modeled on Meta Business
Suite's Inbox. Lives on the **Inbox bottom tab**
(`app/(main)/(drawer)/(tabs)/inbox.tsx`).

> **Status: live backend wired, mock kept behind a flag.** The backend API
> (Phases 1–4) is implemented. `data/use-inbox.ts` exposes a `USE_MOCK_INBOX`
> flag:
> - `true` (current default) → in-memory mock, for offline demos / stakeholder
>   review before Meta App Review grants the messaging scopes.
> - `false` → live backend API (`use-inbox.api.ts`) hitting
>   `/api/v2/brands/:brandId/inbox`.
>
> A floating **dev state-switcher** (bottom-right, mock only) cycles the three states:
> 1. **No socials** — empty conversion state → "Connect accounts"
> 2. **Connected** — accounts linked, but no messages/comments yet
> 3. **Populated** — real-feeling DMs + comments you can reply to / hide / delete
>
> Flip `USE_MOCK_INBOX = false` to run against the real backend (returns live
> data only once the brand's connected IG/FB accounts have App-Review-approved
> messaging scopes — see `backend-sls/docs/inbox-meta-permissions.md`).

---

## Architecture (why removal is one prompt)

The UI talks to its data through a **single seam**:

```
components/inbox/data/use-inbox.ts   →  useInbox(): UseInboxResult
```

Everything else (`InboxView`, `ConversationList`, `ThreadView`, `ContactPanel`,
composer, empty states) is **production-ready** and only depends on that hook
and on the type contract in `types.ts`. Swap the hook's body and the UI is done.

```
components/inbox/
├── README.md                 ← you are here
├── types.ts                  ← data contract (KEEP — backend must satisfy this)
├── utils.ts                  ← channel meta, time, filters (KEEP)
├── data/
│   ├── use-inbox.ts          ← THE SEAM. Branches on USE_MOCK_INBOX.
│   └── use-inbox.api.ts      ← live backend implementation (KEEP)
├── InboxView.tsx             ← responsive 3→1 pane orchestrator (KEEP)
├── ConversationList.tsx      ← list + filters + search (KEEP)
├── ThreadView.tsx            ← DM bubbles / comment thread + moderation (KEEP)
├── MessageComposer.tsx       ← reply box, 24h-window aware (KEEP)
├── ContactPanel.tsx          ← right-hand contact/CRM panel (KEEP)
├── ChannelAvatar.tsx         ← avatar + IG/FB badge (KEEP)
├── EmptyNoSocials.tsx        ← state 1 (KEEP)
├── EmptyNoMessages.tsx       ← state 2 (KEEP)
└── mock/                     ← ⛔ DELETE ENTIRELY when going live
    ├── scenario.ts
    ├── mock-scenario-context.tsx
    ├── mock-data.ts
    ├── use-inbox-mock.ts
    └── DevStateSwitcher.tsx
```

---

## 🔁 Removing the mock (one-prompt instructions)

> **Prompt to give the AI:** *"Remove the Inbox mock layer following
> `trendly-brands/components/inbox/README.md`, and implement `useInbox()` against
> the real backend."*

Exact steps the AI should perform:

1. **Flip the flag:** set `USE_MOCK_INBOX = false` in
   `components/inbox/data/use-inbox.ts` (and drop the mock branch so `useInbox()`
   just returns `useInboxApi()`). The live implementation already exists in
   `data/use-inbox.api.ts` and satisfies the `UseInboxResult` contract.
2. **Delete the mock folder:** `components/inbox/mock/` (all 5 files) and remove
   the now-unused `useInboxMock` import from `use-inbox.ts`.
3. **Clean the screen** — in `app/(main)/(drawer)/(tabs)/inbox.tsx` remove the
   three `MOCK` blocks: the two mock imports, the `<MockScenarioProvider>`
   wrapper, and `<DevStateSwitcher />`. The screen then renders `<InboxView />`
   directly.
4. **Verify** nothing else imports from `components/inbox/mock/`
   (`grep -r "inbox/mock" trendly-brands` should return nothing).

Files under "KEEP" above should need **no changes** — if they do, the backend
isn't satisfying the contract.

---

## Backend contract (`types.ts → UseInboxResult`)

```ts
interface UseInboxResult {
  loading: boolean;
  connectedAccounts: ConnectedInboxAccount[];   // IG/FB accounts for this brand
  conversations: InboxConversation[];           // unified DMs + comments
  sendReply(conversationId, text): Promise<void>;
  setCommentHidden(conversationId, hidden): Promise<void>;
  deleteComment(conversationId): Promise<void>;
  markRead(conversationId): Promise<void>;
}
```

Key contract notes the backend must honor:
- **DM 24h window:** set `replyWindowExpiresAt` (epoch ms) on DM conversations.
  The composer auto-disables when it has passed. Comments omit it (always open).
- **Comment payload:** `kind: "comment"` carries `post` (the post it's on) and
  `comment` (text, `hidden`, `replies[]`).
- **DM payload:** `kind: "dm"` carries `messages[]` with `author: "contact" | "business"`.
- **Contact context** (`contact`) is optional; when `isTrendlyInfluencer` +
  `linkedInfluencerId` are present, the panel shows a "View in CRM" deep-link.

Permissions / App Review required for the live data are documented in
`backend-sls/docs/inbox-meta-permissions.md`.

---

## Design notes

- **Responsive:** 3 panes on web (`xl` ≥1024) — list | thread | contact;
  single-pane drill-down on mobile (list → thread → details overlay).
- **Channels:** Instagram (pink) / Facebook (blue) via `colors.socialInstagram`
  / `colors.socialFacebook`, always paired with the platform glyph.
- **Styling:** follows the repo rules — `Colors(theme)` tokens only, shadows
  (never borders) for separation, `colors.tag` for inputs, `useBreakpoints()`
  for layout. See `trendly-brands/CLAUDE.md`.
