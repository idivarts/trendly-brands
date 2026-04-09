---
name: Users Contract Flow Parity
overview: Create a complete, unambiguous implementation context for Trendly-users to mirror the contract-with-payment flow from Trendly-brands, including state actions, API structure, shared-module usage, and UI parity via ActionContainer.
todos:
  - id: map-states-users
    content: Map each contract status to exact users-side allowed actions and blocked actions, using brands flow as baseline.
    status: pending
  - id: build-users-actioncontainer
    content: Create users ActionContainer with same architecture and UI behavior parity as brands ActionContainer.
    status: pending
  - id: align-state-api-files
    content: Create/align per-state API files under components/contracts/api with exact backend payload keys and conditional fields.
    status: pending
  - id: wire-user-ui-actions
    content: Integrate modals/bottom sheets and action handlers for user-owned states, including refresh and error handling.
    status: pending
  - id: validate-e2e-flow
    content: Run full state progression validation and regression checks to ensure no missing transition breaks the flow.
    status: pending
isProject: false
---

# Contract-with-Payment Flow Context for Trendly-users

## Goal
Replicate the contract-with-payment flow on the users app with exact state behavior parity, shared model usage, and consistent UI/action architecture with brands.

## Source of Truth (Reuse First)
- Reuse shared contract state/types from [shared-constants/contract-status.ts](/Users/jayeshpurswani/TRENDLY/trendly-brands/shared-constants/contract-status.ts).
- Reuse shared Firestore contract model from [shared-libs/firestore/trendly-pro/models/contracts.ts](/Users/jayeshpurswani/TRENDLY/trendly-brands/shared-libs/firestore/trendly-pro/models/contracts.ts).
- Mirror orchestration pattern from [components/contracts/ActionContainer.tsx](/Users/jayeshpurswani/TRENDLY/trendly-brands/components/contracts/ActionContainer.tsx).
- Mirror API separation pattern from [components/contracts/api/State_3_api.ts](/Users/jayeshpurswani/TRENDLY/trendly-brands/components/contracts/api/State_3_api.ts), [components/contracts/api/State_4_api.ts](/Users/jayeshpurswani/TRENDLY/trendly-brands/components/contracts/api/State_4_api.ts), [components/contracts/api/State_6_api.ts](/Users/jayeshpurswani/TRENDLY/trendly-brands/components/contracts/api/State_6_api.ts), [components/contracts/api/State_7_api.ts](/Users/jayeshpurswani/TRENDLY/trendly-brands/components/contracts/api/State_7_api.ts), [components/contracts/api/State_8_api.ts](/Users/jayeshpurswani/TRENDLY/trendly-brands/components/contracts/api/State_8_api.ts).

## Required Code Structure (Users App)
- `components/contracts/ActionContainer.tsx`
  - Single state router for button actions + messages + modal/bottom-sheet visibility.
  - Must match brands component behavior and UI blocks to keep parity.
- `components/contracts/api/State_<n>_api.ts`
  - One file per state transition endpoint.
  - No inline API calls inside UI components.
  - Each API file contains payload type(s), request call, and normalized error mapping.
- State-specific UI components under `components/contracts/`
  - Bottom sheets/modals for data capture and confirmations.
  - Keep naming and responsibility symmetric with brands to reduce drift.

## State-by-State Actions and Ownership Matrix (Include in Cursor context)
- **State 0 Pending**
  - **Brand owner:** Payment initiation and contract start gates.
  - **Influencer owner:** Passive; can coordinate via chat.
  - **Users app requirement:** Show wait-for-brand messaging and chat CTA; no invalid state mutation.

- **State 1 Started**
  - **Brand owner:** Starts operational flow to shipment/video-pending path.
  - **Influencer owner:** Passive, awaits next step.
  - **Users app requirement:** Informational state + messaging affordance.

- **State 3 ShipmentPending**
  - **Brand owner:** Add shipment details and dispatch.
  - **Influencer owner:** Await shipment; optionally confirm address availability.
  - **Users app requirement:** Address visibility/readiness UI and expectation messaging.

- **State 4 DeliveryPending**
  - **Brand owner:** Mark delivered with proof + optional notes.
  - **Influencer owner:** Await delivered confirmation.
  - **Users app requirement:** Display delivery-in-progress status; prevent premature upload actions.

- **State 5 VideoPending**
  - **Brand owner:** Nudge/request upload.
  - **Influencer owner:** Upload deliverable video.
  - **Users app requirement:** Primary action is upload video (with validation + status refresh).

- **State 6 ReviewPending**
  - **Brand owner:** Request revision or approve deliverable.
  - **Influencer owner:** Wait for outcome; if revision requested, re-upload.
  - **Users app requirement:** Show review lock state, revision note visibility, and re-upload path when requested.

- **State 7 PlanRelease (Release Pending)**
  - **Brand owner:** Reschedule posting date via API (`newScheduledDate` epoch ms).
  - **Influencer owner:** Passive awareness of upcoming release date.
  - **Users app requirement:** Read-only schedule visibility and notification-ready messaging.

- **State 8 PostScheduled**
  - **Brand owner:** Optional further date updates (if backend allows).
  - **Influencer owner:** Wait for go-live.
  - **Users app requirement:** Scheduled date visibility + countdown/expectation UX.

- **State 9 PostDone**
  - **Brand owner:** Feedback completion.
  - **Influencer owner:** Feedback completion.
  - **Users app requirement:** Feedback CTA and closure messaging.

- **State 10 Settled**
  - **Brand owner:** Closed.
  - **Influencer owner:** Closed.
  - **Users app requirement:** Terminal read-only contract summary.

## API Parity Rules for Users Implementation
- Keep state endpoint wrappers isolated by file (`State_n_api.ts`).
- Keep payload keys exactly backend-defined (no UI naming leakage).
- Use epoch milliseconds for all schedule fields.
- Apply conditional field inclusion:
  - For deliverable approval posting scenario `3` (brand posts individually), omit scheduled date.
- Centralize request errors through `HttpWrapper.extractErrorMessage` patterns for consistent toasts.

## ActionContainer Parity Rules
- Build same decision tree style as brands `ActionContainer` so state-to-action mapping remains deterministic.
- Keep `buttons` + `message` config derivation in one memoized block.
- Keep side-effect handlers (`handle<State>Action`) separated from render.
- Keep modal/bottom-sheet orchestration colocated with ActionContainer to avoid fragmented state transitions.

## Cross-App UI Consistency Requirements
- Replicate shared visual shell via [shared-uis/components/contract-actions-with-message/ContractActionsWithMessage.tsx](/Users/jayeshpurswani/TRENDLY/trendly-brands/shared-uis/components/contract-actions-with-message/ContractActionsWithMessage.tsx).
- Preserve same information hierarchy: primary/secondary buttons + contextual status message.
- Keep labels and status copy semantically equivalent between apps (actor-specific phrasing allowed).

## Non-Negotiable Validation Checklist (to avoid flow breaks)
- Every contract state maps to explicit user-side UI behavior (no fallthrough ambiguity).
- All API transitions used by users app exist in `components/contracts/api` wrappers.
- All state transitions refresh data and reconcile local UI state.
- Invalid actions are blocked by state guardrails in ActionContainer.
- Shared model/type imports are used; no duplicate local enums/interfaces.
- Regression pass: each state entered from previous state behaves correctly on both web and native.

## Implementation Sequence
1. Port/create users `components/contracts/ActionContainer.tsx` with brands-parity skeleton.
2. Add/align users `components/contracts/api/State_n_api.ts` wrappers for all user-owned transitions.
3. Port/align required modals/bottom sheets for user-owned actions (upload/revision/feedback/status views).
4. Wire action handlers to API wrappers and toasts; ensure refresh hooks fire after each success.
5. Validate state machine end-to-end with test contracts across statuses 0→10.
6. Run lint/type checks and do manual QA for state/action ownership boundaries.

## Optional Add-on Included in This Plan
- Add a dedicated in-repo reference doc (for Cursor context) containing the ownership matrix above so future prompts can anchor on it and avoid ambiguity.