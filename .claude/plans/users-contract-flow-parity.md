# Plan: Users ↔ Brands Contract Flow Parity

**Status**: Reference implementation spec — use this when working on the contract flow in either app.

**Migrated from**: `.cursor/plans/users_contract_flow_parity_36bfdaff.plan.md`

**Note**: This plan lives in the brands app (it was authored here) but is also copied to `trendly-users/.claude/plans/users-contract-flow-parity.md`. The brands `ActionContainer` and `State_<n>_api.ts` files are the **source of truth** — the users app mirrors this pattern.

---

## Goal

Replicate the contract-with-payment flow on the **users app** with exact state behavior parity, shared module usage, and consistent UI/action architecture with brands.

---

## Source of Truth — Reuse First

| What | File in brands app |
|---|---|
| Contract status enum | `shared-constants/contract-status.ts` |
| Firestore contract model | `shared-libs/firestore/trendly-pro/models/contracts.ts` |
| ActionContainer pattern | `components/contracts/ActionContainer.tsx` |
| Per-state API files | `components/contracts/api/State_3_api.ts`, `State_4_api.ts`, `State_6_api.ts`, `State_7_api.ts`, `State_8_api.ts` |
| Shared UI shell | `shared-uis/components/contract-actions-with-message/ContractActionsWithMessage.tsx` |

---

## Required Code Structure (Users App)

```
components/contracts/
├── ActionContainer.tsx          # Single state router — mirrors brands architecture
├── api/
│   ├── State_0_api.ts           # (usually passive — but define for completeness)
│   ├── State_5_api.ts           # Upload deliverable (influencer primary action)
│   ├── State_6_api.ts           # Re-upload on revision request
│   └── State_9_api.ts           # Feedback submission
└── (modals / bottom sheets for user-owned states)
```

Rules:
- **No inline API calls** in UI components — all API calls go in `components/contracts/api/State_<n>_api.ts`
- Each API file: payload type(s) + request call + normalized error mapping
- State-specific UI components (bottom sheets/modals) under `components/contracts/` — symmetric naming with brands

---

## State-by-State Ownership Matrix

| State | # | Brand Owner | Influencer Owner | Users App Requirement |
|---|---|---|---|---|
| Pending | 0 | Payment initiation, contract start | Passive | Wait-for-brand messaging + chat CTA. No state mutation. |
| Started | 1 | Starts operational flow to shipment/video-pending | Passive | Informational state + messaging affordance |
| ShipmentPending | 3 | Add shipment details and dispatch | Await shipment | Address visibility/readiness UI + expectation messaging |
| DeliveryPending | 4 | Mark delivered with proof + optional notes | Await confirmation | Show delivery-in-progress status; block premature upload actions |
| VideoPending | 5 | Nudge/request upload | **Upload deliverable video** | Primary action: upload video with validation + status refresh |
| ReviewPending | 6 | Request revision or approve | Wait; re-upload if revised | Show review lock; revision note visibility; re-upload path when requested |
| PlanRelease | 7 | Reschedule posting date (`newScheduledDate` epoch ms) | Passive awareness | Read-only schedule visibility + notification-ready messaging |
| PostScheduled | 8 | Optional further date updates | Wait for go-live | Scheduled date visibility + countdown/expectation UX |
| PostDone | 9 | **Feedback completion** | **Feedback completion** | Feedback CTA + closure messaging |
| Settled | 10 | Closed | Closed | Terminal read-only contract summary |

---

## API Parity Rules

- Isolate state endpoint wrappers by file (`State_<n>_api.ts`) — one file per state transition
- Keep payload keys exactly as defined in backend (no UI naming leakage)
- Use **epoch milliseconds** for all schedule fields
- Conditional field inclusion: for deliverable approval posting scenario `3` (brand posts individually), omit `scheduledDate`
- Centralize error handling through `HttpWrapper.extractErrorMessage` (consistent toasts)

---

## ActionContainer Parity Rules

- Build same decision tree as brands `ActionContainer` — state-to-action mapping is deterministic
- Buttons + message config derivation: keep in one `useMemo` block
- Side-effect handlers (`handle<State>Action`): separated from render
- Modal/bottom-sheet orchestration: colocated with ActionContainer — no fragmented state transitions

---

## Cross-App UI Consistency

- Use `shared-uis/components/contract-actions-with-message/ContractActionsWithMessage.tsx` as the visual shell
- Same information hierarchy: primary/secondary buttons + contextual status message
- Labels/copy: semantically equivalent between apps — actor-specific phrasing allowed (e.g., "Waiting for brand to confirm" vs "Confirm delivery")

---

## Implementation Sequence

1. Port/create users `components/contracts/ActionContainer.tsx` with brands-parity skeleton
2. Add/align users `components/contracts/api/State_<n>_api.ts` for all user-owned transitions (5, 6, 9 minimum)
3. Port/align modals and bottom sheets for user-owned actions (upload, revision, feedback, status views)
4. Wire action handlers to API wrappers + toasts; ensure `refreshData` fires after each success
5. Validate state machine end-to-end with test contracts across all states 0→10
6. Run lint/type checks + manual QA for state/action ownership boundaries

---

## Non-Negotiable Validation Checklist

- [ ] Every contract state maps to explicit users-side UI behavior (no fallthrough ambiguity)
- [ ] All API transitions have `components/contracts/api/State_<n>_api.ts` wrappers
- [ ] All state transitions refresh data and reconcile local UI state
- [ ] Invalid actions are blocked by state guardrails in ActionContainer
- [ ] Shared model/type imports used — no duplicate local enums or interfaces
- [ ] Regression: each state entered from the previous state behaves correctly on both web and native
