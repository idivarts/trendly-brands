# Contract + Payment Flow: End-to-End Guide

This document explains the entire contract-with-payment flow, every file involved (new and modified), and how the **Trendly Brands** and **Trendly Users** apps interact through shared modules.

---

## 1. High-Level Flow (State Machine)

The contract is driven by a **10-state machine** (status 0–10 in Firestore). Progress happens in the **message thread** (created when the brand accepts the influencer) and on the **contract details screen** in each app.

**KYC is a gate, not a state:** The brand and influencer must not start the campaign/contract until the influencer has completed KYC. This is enforced in the UI (e.g. block “Make Payment” / “Start Contract” when `isContractBlockedByKYC(user)` is true); the contract status is never set to a “KYC” state.

```
STATE 0  → Pending (contract created, no payment yet; KYC gate blocks start until influencer KYC done)
STATE 1  → Started (legacy)
STATE 2  → Payment Failed (brand only; retry payment)
STATE 3  → Paid → branch: Product shipping → STATE 4, else → STATE 7 (DeliverableSent)
STATE 4  → Shipped (brand adds shipment details)
STATE 5  → Delivered (brand marked as shipped)
STATE 6  → Received (influencer marked received; next: upload video)
STATE 7  → DeliverableSent (video submitted; brand approves or requests revision)
STATE 8  → Post Scheduled (brand set release date; show date, can change)
STATE 9  → Post Done (video posted)
STATE 10 → Settled (contract closed)
```

**Single source of truth:** The `contracts` document in Firestore. Its `status` field holds a number **0–10**. Optional fields: `payment`, `shipment`, `deliverable`, `posting`, `contractTimestamp`.

---

## 2. Where Things Live: Shared vs App-Specific

| Layer | Location | Used by |
|-------|----------|--------|
| **State enum, labels, descriptions** | `shared-constants` | Both apps |
| **Contract + payment/shipping/release types** | `shared-libs` (Firestore models) | Both apps |
| **Status display UI (badge + description + release date)** | `shared-uis` | Both apps |
| **Brand actions (Make Payment, Add Shipment, Approve, Plan Release, etc.)** | `trendly-brands` only | Brands app |
| **Influencer actions (Complete KYC, Upload Video, Re-upload, Nudge Brand, etc.)** | `trendly-users` only | Users app |

Both apps read the **same** Firestore `contracts` doc and **same** collaboration doc. They show the same status (via shared UI) but different buttons and copy (via `actor`: `"brand"` vs `"influencer"`).

---

## 3. New Files (What Each Does)

### 3.1 `shared-constants/contract-status.ts`

**Role:** Single source of truth for the state machine and copy. No UI, no Firestore.

- **`ContractStatus`** (enum 0–10): Pending, Started, PaymentFailed, Paid, Shipped, Delivered, Received, DeliverableSent, PostScheduled, PostDone, Settled.
- **`isContractBlockedByKYC(user)`**: Returns true if contract actions should be blocked because influencer KYC is not done (gate only; not a contract state).
- **`CONTRACT_STATUS_LABELS`**: Human-readable label per status (e.g. "Pending", "Shipped", "Post Scheduled").
- **`getContractStatusDescription(status, actor)`**: Returns the short description for **brand** or **influencer**. PaymentFailed returns `null` for influencer.
- **Types:** `PaymentStatusType`, `FulfillmentType`, `ReleasePlanOption`, `ContractStatusActor` (`"brand" | "influencer"`).
- **`RELEASE_DATE_MAX_DAYS`**: 30 (max release date from today).

**Used by:**  
- **Trendly Brands:** ActionContainer (status checks, labels), ContractStatusView (labels + descriptions).  
- **Trendly Users:** Contract status screen (same): import this file and `ContractStatusView` with `actor="influencer"`; show influencer-only actions.

---

### 3.2 `shared-uis/components/contract-status/ContractStatusView.tsx`

**Role:** Shared presentational component that shows the **current contract status** in both apps.

- **Props:**  
  - `status` (number 0–10),  
  - `actor` (`"brand"` | `"influencer"`),  
  - `scheduledReleaseAt?` (timestamp for PostScheduled; e.g. from `contract.posting?.scheduledDate`),  
  - `showDescription?`,  
  - `overrideLabel?` / `overrideDescription?` (optional display overrides).
- **Behavior:**  
  - Renders a **badge** with the status label (from `CONTRACT_STATUS_LABELS` or override).  
  - If `showDescription`, shows the line from `getContractStatusDescription(status, actor)`.  
  - For PostScheduled (8) + `scheduledReleaseAt`, shows “Release scheduled for: [date]” (brand) or “Video scheduled for release on: [date]” (influencer).  
  - PaymentFailed (2) uses error-style (e.g. red) for the badge.
- **Styling:** Uses `useTheme()`, `Colors(theme)`, `StyleSheet` at bottom (no hardcoded colors, per workspace rules).

**Used by:**  
- **Trendly Brands:** Rendered inside `ActionContainer` with `actor="brand"`.  
- **Trendly Users:** Import from shared-uis and render with `actor="influencer"` on the contract details (or equivalent) screen; no code change in shared-uis.

---

### 3.3 `shared-uis/components/contract-status/index.ts`

**Role:** Re-export so apps can do:

- `import { ContractStatusView } from "@/shared-uis/components/contract-status"`.

---

## 4. Modified Files (What Changed)

### 4.1 `shared-libs/firestore/trendly-pro/models/contracts.ts`

**Role:** Firestore contract document shape; used by both apps when reading/writing `contracts` and when typing API payloads.

- **Contract status:** `status` is 0–10 (enum ContractStatus: Pending, Started, PaymentFailed, Paid, Shipped, Delivered, Received, DeliverableSent, PostScheduled, PostDone, Settled).
- **Nested objects:** `payment?`, `shipment?`, `deliverable?`, `posting?` (e.g. `posting.scheduledDate`, `posting.postingScenario`), `analytics?`, `activity?`.
- **Types:** `Payment`, `Shipment`, `Deliverable`, `Posting`, etc. (see shared-libs contracts.ts).

**Used by:**  
- **Trendly Brands:** Contract screen fetches contract; ActionContainer reads `contract.status`, `contract.paymentStatus`, `contract.releasePlan` and writes status + timestamps + shipping/release when the brand does actions.  
- **Trendly Users:** Same contract doc; reads same fields and updates status when influencer does actions (e.g. upload video, mark delivered).

---

### 4.2 `components/contracts/ActionContainer.tsx` (Trendly Brands)

**Role:** Brand-side contract actions and status display on the contract details screen.

- **New inputs:**  
  - `collaborationData` (ICollaboration): used to know if collaboration is product shipping (`promotionSubject === "physical_product"`) so after payment we go to Shipped (4) or DeliverableSent (7).  
  - `paymentStatus`: from contract (or payments collection); used for payment states.
- **KYC gate:** **`kycBlocked = (status === Pending) && isContractBlockedByKYC(userData)`**. When true, show “The influencer must complete KYC before the contract can start” and do not show “Make Payment” or “Start Contract”. KYC is not a contract state.
- **Status handling:**  
  - **`normalizeStatus(contract.status)`:** Pass-through 0–10; legacy 2/3 map to DeliverableSent/Settled if needed.
- **Rendering:**  
  - Always shows **ContractStatusView** with `actor="brand"`, `status` (0–10), `scheduledReleaseAt={contract.posting?.scheduledDate}`.  
  - When **kycBlocked**, show only the KYC message (no Make Payment / Start Contract).  
  - Then, per **normalized status**, shows the right **brand** buttons:
    - Pending (0) and !kycBlocked → “Make Payment”
    - PaymentFailed (2) → “Retry Payment”
    - Paid (3) → “Start Contract” (calls `startContractAfterPayment` → status Shipped 4 or DeliverableSent 7)
    - Shipped (4) → “View Influencer Address”, “Add Shipment Details”
    - Delivered (5) → “Mark as Delivered” → status Received (6)
    - Received (6) → “Nudge Influencer”, “Go to Messages”
    - DeliverableSent (7) → “Request Revision”, “Approve Video”
    - PostScheduled (8) → “Plan Release”, “Change Release Date” (if date set)
  - Still shows the same feedback/reviews block and info box when `slot` is `"all"` or `"feedback-and-info"`.
- **Helper:** **`startContractAfterPayment`**: writes Firestore status to Shipped (4) or DeliverableSent (7) and calls the same contract-start API.

**Interactions:**  
- Reads/writes Firestore `contracts/<streamChannelId>`.  
- Uses shared-constants (`ContractStatus`), shared-uis (`ContractStatusView`), shared-libs (`IContracts`, `ICollaboration`, Firestore, HttpWrapper).

---

### 4.3 `components/contracts/ContractDetailContent.tsx` (Trendly Brands)

**Role:** Layout and content of the contract details screen (profile, media, members, actions, campaign link).

- **Change:** Every **ActionContainer** usage now receives:
  - `collaborationData={props.collaborationDetail}`  
  - `paymentStatus={props.contractData.paymentStatus}`  
 so that the new flow (status 1–14 and payment/shipping/release) works and the correct buttons show.

---

### 4.4 `app/(main)/(drawer)/(secondary)/contract-details/[pageID].tsx` (Trendly Brands)

**Role:** Contract details **screen** (route: contract-details/:pageID). Not modified in this feature; it already:

- Takes `pageID` from the route (it is the contract’s `streamChannelId`).
- Fetches the **contract** doc from Firestore (`contracts/<pageID>`).
- Fetches **user** (influencer), **applications**, and **collaboration** and builds `ICollaborationCard` (contract + userData + applications + collaborationData).
- Passes that into **ContractDetailsContent** as `contractData`, `userData`, `collaborationDetail`, `applicationData`, and `refreshData`.

So the **data flow** is: **Screen** → **ContractDetailContent** → **ActionContainer** and **ContractStatusView**. Contract and collaboration are the same documents the **Trendly Users** app will read for the same contract.

---

## 5. How Trendly-Users App Uses the Same Flow

Trendly-users will use the **same** shared modules and **same** Firestore documents; only the **actor** and **actions** differ.

### 5.1 Shared pieces (no duplication)

- **shared-constants/contract-status.ts**  
  - Import: `ContractStatus`, `isContractBlockedByKYC`, `CONTRACT_STATUS_LABELS`, `getContractStatusDescription`, `ContractStatusActor`, `RELEASE_DATE_MAX_DAYS`, `ReleasePlanOption`.  
  - Use: Decide what to show and what actions are allowed; get label and description for `actor="influencer"`. Use **isContractBlockedByKYC(user)** as a gate (do not allow starting contract until KYC done); KYC is not a state.

- **shared-uis/components/contract-status**  
  - Import: `ContractStatusView`.  
  - Use: On the influencer’s contract details (or equivalent) screen, render:  
    `<ContractStatusView status={normalizedStatus} actor="influencer" scheduledReleaseAt={contract.posting?.scheduledDate} showDescription />`  
  - No changes needed inside shared-uis; the same component shows influencer copy because of `actor="influencer"`.

- **shared-libs**  
  - Same `IContracts`, `payment`, `shipment`, `deliverable`, `posting`, etc.  
  - Same Firestore path: `contracts/<streamChannelId>`.  
  - Influencer app will **read** the same doc and **update** only the fields the influencer changes (e.g. mark received, video upload, re-upload after revision).

### 5.2 Trendly-users-specific (to implement there)

- **Contract details (or equivalent) screen**  
  - Load the same contract doc (and collaboration, user) as in Brands.  
  - Render **ContractStatusView** with `actor="influencer"`. When **isContractBlockedByKYC(user)** is true and status is Pending, show “Complete KYC to start the contract” and do not show other contract actions.

- **Influencer-only actions** (by status 0–10), for example:
  - **Pending (0) and KYC not done:** “Complete KYC” → navigate to KYC screen (gate; no contract write).
  - **Pending (0):** “Nudge Brand for Payment” → send a predefined chat message (no contract write).
  - **Shipped (4):** Message only: “Shipment is pending from the brand.”
  - **Delivered (5):** “Mark as Received” (product only) → `updateDoc(contractRef, { status: ContractStatus.Received })`.
  - **Received (6) / DeliverableSent (7):** “Upload Video” or “Re-upload Video” → upload flow then `updateDoc(contractRef, { status: ContractStatus.DeliverableSent })`.
  - **PostScheduled (8):** Show date only (ContractStatusView shows “Video scheduled for release on: [date]”).
  - **PostDone (9) / Settled (10):** “Contract closed.”

- **Chat thread**  
  - Same channel (`streamChannelId`); “Nudge” actions send messages in this thread (same as in Brands for “Nudge Influencer”).

So: **one 10-state machine, one contract document, one shared UI component, KYC as gate** — each app passes its `actor` and implements its own action handlers.

---

## 6. Data Flow Summary

```
Firestore: contracts/<streamChannelId>
  ├── status (0–10)
  ├── payment?, shipment?, deliverable?, posting?
  ├── contractTimestamp, feedbackFromBrand, feedbackFromInfluencer, ...
  └── collaborationId, userId, brandId, streamChannelId, ...

         │
         ▼
Trendly Brands (contract-details/[pageID])
  ├── Fetches contract + user + collaboration + applications
  ├── ContractDetailContent
  │     └── ActionContainer (actor="brand")
  │           ├── KYC gate: block Make Payment / Start Contract if !userData.isKYCDone
  │           ├── ContractStatusView (status 0–10, actor="brand", scheduledReleaseAt=posting?.scheduledDate)
  │           └── Brand buttons per status (Make Payment, Add Shipment, Approve, Plan Release, ...)
  └── Writes: status, contractTimestamp, shipment, posting (and payment via backend)

         │
         ▼ (same contract doc)
Trendly Users (contract details screen – to be built)
  ├── Fetches same contract + collaboration + user
  ├── KYC gate: block contract actions until influencer KYC done (gate only; not a state)
  ├── ContractStatusView (status 0–10, actor="influencer", scheduledReleaseAt=posting?.scheduledDate)
  └── Influencer buttons per status (Complete KYC when blocked, Nudge Brand, Mark Received, Upload Video, Re-upload, ...)
```

---

## 7. File Reference Quick Table

| File | App | Purpose |
|------|-----|--------|
| `shared-constants/contract-status.ts` | Both | Enum 0–10, isContractBlockedByKYC, labels, getContractStatusDescription(status, actor), types |
| `shared-uis/.../contract-status/ContractStatusView.tsx` | Both | Status badge + description + release date; theme-aware |
| `shared-uis/.../contract-status/index.ts` | Both | Re-export |
| `shared-libs/.../models/contracts.ts` | Both | IContracts, ContractStatus 0–10, payment, shipment, deliverable, posting |
| `components/contracts/ActionContainer.tsx` | Brands | KYC gate + status display + brand actions; Firestore updates |
| `components/contracts/ContractDetailContent.tsx` | Brands | Passes collaborationData + paymentStatus to ActionContainer |
| `app/.../contract-details/[pageID].tsx` | Brands | Screen: fetch contract + collaboration, render ContractDetailContent |

This is the full picture of the contract-with-payment flow (10 states, KYC as gate) and how it is shared with Trendly-users.
