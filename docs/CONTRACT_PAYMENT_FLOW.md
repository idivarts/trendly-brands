# Contract + Payment Flow: End-to-End Guide

This document explains the entire contract-with-payment flow, every file involved (new and modified), and how the **Trendly Brands** and **Trendly Users** apps interact through shared modules.

---

## 1. High-Level Flow (State Machine)

The contract is driven by a **14-state machine**. Progress happens in the **message thread** (created when the brand accepts the influencer) and on the **contract details screen** in each app.

```
STATE 1  → KYC Verification (gate: influencer must complete KYC)
STATE 2  → Contract Pending (contract created, no payment yet)
STATE 3  → Payment Pending (brand must pay via Razorpay)
STATE 4  → Payment Failed (brand only; retry payment)
STATE 5  → Payment Successful → branch:
           • Product/Service Shipping → STATE 6
           • Otherwise → STATE 8 (skip shipping)
STATE 6  → Shipping Pending (brand adds courier, tracking)
STATE 7  → Delivery Pending (influencer marks received / uploads proof)
STATE 8  → Video Pending (influencer uploads video)
STATE 9  → Review Pending (brand approves or requests revision)
STATE 10 → Revision Pending (influencer re-uploads; loop back to 9 until approved)
STATE 11 → Release Planning (brand picks: brand+influencer / influencer alone / brand alone + date)
STATE 12 → Release Scheduled (show date; brand can change date)
STATE 13 → Video Posted (when scheduled date passes; auto or manual)
STATE 14 → Settlement Done (contract closed; escrow released)
```

**Single source of truth:** The `contracts` document in Firestore. Its `status` field holds a number **1–14** (or legacy 0–3). Optional fields: `paymentStatus`, `shippingDetails`, `releasePlan`.

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

- **`ContractStatus`** (enum 1–14): KYC_VERIFICATION, CONTRACT_PENDING, PAYMENT_PENDING, … SETTLEMENT_DONE.
- **`CONTRACT_STATUS_LABELS`**: Human-readable label per status (e.g. "Payment Pending", "Shipping Pending").
- **`getContractStatusDescription(status, actor)`**: Returns the short description string for that status for **brand** or **influencer** (e.g. brand: "Deposit the collaboration payment to proceed.", influencer: "Payment from the brand is pending."). PAYMENT_FAILED returns `null` for influencer (they never see that state).
- **Types:** `PaymentStatusType`, `FulfillmentType`, `ReleasePlanOption`, `ContractStatusActor` (`"brand" | "influencer"`).
- **`RELEASE_DATE_MAX_DAYS`**: 30 (max release date from today).

**Used by:**  
- **Trendly Brands:** ActionContainer (status checks, labels), ContractStatusView (labels + descriptions).  
- **Trendly Users:** Contract status screen (same): import this file and `ContractStatusView` with `actor="influencer"`; show influencer-only actions.

---

### 3.2 `shared-uis/components/contract-status/ContractStatusView.tsx`

**Role:** Shared presentational component that shows the **current contract status** in both apps.

- **Props:**  
  - `status` (number 1–14; legacy 0 → shown as Contract Pending),  
  - `actor` (`"brand"` | `"influencer"`),  
  - `scheduledReleaseAt?` (timestamp for state 12),  
  - `showDescription?`,  
  - `overrideLabel?` / `overrideDescription?` (e.g. legacy “Active” in Brands app).
- **Behavior:**  
  - Renders a **badge** with the status label (from `CONTRACT_STATUS_LABELS` or override).  
  - If `showDescription`, shows the line from `getContractStatusDescription(status, actor)`.  
  - For RELEASE_SCHEDULED + `scheduledReleaseAt`, shows “Release scheduled for: [date]” (brand) or “Video scheduled for release on: [date]” (influencer).  
  - PAYMENT_FAILED uses error-style (e.g. red) for the badge.
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

- **New / updated:**
  - Comment that `status` follows shared-constants (1–14); legacy 0 still allowed.
  - **`paymentStatus?`**: `"pending" | "processing" | "completed" | "failed"` (from Razorpay/escrow).
  - **`shippingDetails?`**: `ContractShippingDetails` (courierName, trackingNumber, shipmentLink, shippedAt).
  - **`releasePlan?`**: `ContractReleasePlan` (option + scheduledReleaseAt).
- **Types:** `ContractStatusNumber`, `PaymentStatusFromProvider`, `ContractShippingDetails`, `ContractReleasePlan`, `ReleasePlanOption`.

**Used by:**  
- **Trendly Brands:** Contract screen fetches contract; ActionContainer reads `contract.status`, `contract.paymentStatus`, `contract.releasePlan` and writes status + timestamps + shipping/release when the brand does actions.  
- **Trendly Users:** Same contract doc; reads same fields and updates status when influencer does actions (e.g. upload video, mark delivered).

---

### 4.2 `components/contracts/ActionContainer.tsx` (Trendly Brands)

**Role:** Brand-side contract actions and status display on the contract details screen.

- **New inputs:**  
  - `collaborationData` (ICollaboration): used to know if collaboration is product shipping (`promotionSubject === "physical_product"`) so after payment we go to state 6 or 8.  
  - `paymentStatus`: from contract (or payments collection); used for payment states.
- **Status handling:**  
  - **`normalizeStatus(contract.status)`:** Maps legacy 0–3 to display status 2 / 9 / 14 so the new state labels still make sense.  
  - **`isLegacyFlow`:** When `contract.status` is 0 or 1 and `collaborationData` is not passed, keeps old “Start Contract” / “End Contract” / “Go to Messages” behavior and uses override label “Active” for status 1.
- **Rendering:**  
  - Always shows **ContractStatusView** with `actor="brand"`, `status`, `scheduledReleaseAt`, and optional overrides for legacy.  
  - Then, per **normalized status**, shows the right **brand** buttons (with placeholder toasts where backend/Razorpay/modals are not wired yet):
    - PAYMENT_PENDING → “Make Payment”
    - PAYMENT_FAILED → “Retry Payment”
    - PAYMENT_SUCCESSFUL → “Start Contract” (calls `startContractAfterPayment` → status 6 or 8)
    - SHIPPING_PENDING → “View Influencer Address”, “Add Shipment Details”
    - VIDEO_PENDING / REVISION_PENDING → “Nudge Influencer”, “Go to Messages”
    - REVIEW_PENDING → “Request Revision”, “Approve Video”
    - RELEASE_PLANNING → “Plan Release”
    - RELEASE_SCHEDULED → “Change Release Date”
  - Still shows the same feedback/reviews block and info box when `slot` is `"all"` or `"feedback-and-info"`.
- **New helper:** **`startContractAfterPayment`**: writes Firestore status to SHIPPING_PENDING (6) or VIDEO_PENDING (8) and calls the same contract-start API.

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
  - Import: `ContractStatus`, `CONTRACT_STATUS_LABELS`, `getContractStatusDescription`, `ContractStatusActor`, `RELEASE_DATE_MAX_DAYS`, `ReleasePlanOption`.  
  - Use: Decide what to show and what actions are allowed; get label and description for `actor="influencer"`.

- **shared-uis/components/contract-status**  
  - Import: `ContractStatusView`.  
  - Use: On the influencer’s contract details (or equivalent) screen, render:  
    `<ContractStatusView status={contract.status} actor="influencer" scheduledReleaseAt={contract.releasePlan?.scheduledReleaseAt} showDescription />`  
  - No changes needed inside shared-uis; the same component shows influencer copy because of `actor="influencer"`.

- **shared-libs**  
  - Same `IContracts`, `ContractShippingDetails`, `ContractReleasePlan`, etc.  
  - Same Firestore path: `contracts/<streamChannelId>`.  
  - Influencer app will **read** the same doc and **update** only the fields the influencer changes (e.g. delivery proof, video upload, re-upload after revision).

### 5.2 Trendly-users-specific (to implement there)

- **Contract details (or equivalent) screen**  
  - Load the same contract doc (and collaboration, user) as in Brands.  
  - Render **ContractStatusView** with `actor="influencer"`.

- **Influencer-only actions** (by status), for example:
  - **KYC_VERIFICATION (1):** “Complete KYC” → navigate to KYC screen; disable other contract actions until KYC is done.
  - **PAYMENT_PENDING (3):** “Nudge Brand for Payment” → send a predefined chat message.
  - **SHIPPING_PENDING (6):** Message only: “Shipment is pending from the brand.”
  - **DELIVERY_PENDING (7):** “Upload Delivery Proof” / “Mark as Received” → update contract (e.g. status → VIDEO_PENDING).
  - **VIDEO_PENDING (8):** “Upload Video” → upload flow then set status to REVIEW_PENDING.
  - **REVIEW_PENDING (9):** Message only: “Video is under review.”
  - **REVISION_PENDING (10):** “Re-upload Video” → upload then status back to REVIEW_PENDING.
  - **RELEASE_SCHEDULED (12):** Show date only (ContractStatusView already shows “Video scheduled for release on: [date]”).
  - **VIDEO_POSTED / SETTLEMENT_DONE:** Message or “Contract closed.”

- **Chat thread**  
  - Same channel (`streamChannelId`); “Nudge” actions send messages in this thread (same as in Brands for “Nudge Influencer”).

So: **one state machine, one contract document, one shared UI component, two apps** — each app passes its `actor` and implements its own action handlers.

---

## 6. Data Flow Summary

```
Firestore: contracts/<streamChannelId>
  ├── status (1–14 or legacy 0–3)
  ├── paymentStatus?
  ├── shippingDetails?
  ├── releasePlan?
  ├── contractTimestamp, feedbackFromBrand, feedbackFromInfluencer, ...
  └── collaborationId, userId, brandId, streamChannelId, ...

         │
         ▼
Trendly Brands (contract-details/[pageID])
  ├── Fetches contract + user + collaboration + applications
  ├── ContractDetailContent
  │     └── ActionContainer (actor="brand")
  │           ├── ContractStatusView (status, actor="brand", ...)
  │           └── Brand buttons per status (Make Payment, Add Shipment, Approve, Plan Release, ...)
  └── Writes: status, contractTimestamp, shippingDetails, releasePlan (and later paymentStatus via backend)

         │
         ▼ (same contract doc)
Trendly Users (contract details screen – to be built)
  ├── Fetches same contract + collaboration + user
  ├── ContractStatusView (status, actor="influencer", ...)
  └── Influencer buttons per status (Complete KYC, Nudge Brand, Upload Video, Re-upload, Mark Received, ...)
```

---

## 7. File Reference Quick Table

| File | App | Purpose |
|------|-----|--------|
| `shared-constants/contract-status.ts` | Both | Enum 1–14, labels, getContractStatusDescription(status, actor), types |
| `shared-uis/.../contract-status/ContractStatusView.tsx` | Both | Status badge + description + release date; theme-aware |
| `shared-uis/.../contract-status/index.ts` | Both | Re-export |
| `shared-libs/.../models/contracts.ts` | Both | IContracts, paymentStatus, shippingDetails, releasePlan |
| `components/contracts/ActionContainer.tsx` | Brands | Status display + brand actions; Firestore updates |
| `components/contracts/ContractDetailContent.tsx` | Brands | Passes collaborationData + paymentStatus to ActionContainer |
| `app/.../contract-details/[pageID].tsx` | Brands | Screen: fetch contract + collaboration, render ContractDetailContent |

This is the full picture of the contract-with-payment flow and how it is shared with Trendly-users.
