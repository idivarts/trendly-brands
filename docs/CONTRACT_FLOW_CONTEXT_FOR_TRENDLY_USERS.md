# Contract + Payment Flow — Context for Trendly-Users App

Use this file as **agent/developer context** when implementing or maintaining the contract-with-payment flow in **Trendly-Users**. The flow is shared with **Trendly-Brands** via three shared modules; both apps read/write the **same Firestore contract document**. KYC/verification is already implemented in Trendly-Users; this doc focuses on **contract status UI** and **influencer-side actions** so the flow works in real time in both apps.

---

## Tasks to do after reading this context

After reading this document, implement or verify the following in **Trendly-Users**:

1. **Contract details (or equivalent) screen**
   - Ensure the screen loads the contract from Firestore (`contracts/<streamChannelId>`) and the collaboration doc (for product vs digital). Use `streamChannelId` from the route or context.
   - Add or reuse a `normalizeStatus(contract.status)` helper (Section 3) and use it everywhere you derive status for UI or actions.

2. **Status display**
   - On the contract details screen, render **ContractStatusView** from `@/shared-uis/components/contract-status` with `status={normalizedStatus}`, `actor="influencer"`, `scheduledReleaseAt={contract.releasePlan?.scheduledReleaseAt}`, and `showDescription`. Do not build a custom status badge/label; use this shared component.

3. **Influencer actions by status**
   - For each normalized status (1–14), show the correct influencer action(s) as in the table in Section 4. Implement at least:
     - **KYC_VERIFICATION (1):** “Complete KYC” → navigate to existing KYC/verification flow (no Firestore write).
     - **PAYMENT_PENDING (3):** “Nudge Brand for Payment” → send a predefined message to channel `contract.streamChannelId` via your chat API (no contract write).
     - **DELIVERY_PENDING (7):** “Mark as Received” (only if collaboration is product: `promotionSubject === "physical_product"`) → `updateDoc(contractRef, { status: ContractStatus.VIDEO_PENDING })`; optionally send a chat message. Refresh contract data after update.
     - **VIDEO_PENDING (8):** “Upload Video” → after your upload flow completes → `updateDoc(contractRef, { status: ContractStatus.REVIEW_PENDING })`. Refresh contract data.
     - **REVISION_PENDING (10):** “Re-upload Video” → after re-upload → `updateDoc(contractRef, { status: ContractStatus.REVIEW_PENDING })`. Refresh contract data.
   - For all other statuses (2, 5, 6, 9, 11, 12, 13, 14), show informational copy only (no write). Do not show PAYMENT_FAILED (4) to the influencer.

4. **Firestore and types**
   - Use `doc(FirestoreDB, "contracts", contract.streamChannelId)` and `updateDoc(contractRef, { ... })` for any contract update. Type the contract as `IContracts` and use `ContractStatus` from shared-constants for status values. Do not add new fields to the contract doc that the Brands app does not expect.

5. **Sync and consistency**
   - After every contract update, refresh the contract (and any derived state) so the UI reflects the latest status and stays in sync with Trendly-Brands. Use the same channel id (`streamChannelId`) for all chat/nudge actions so messages appear in the same thread for both apps.

6. **Optional**
   - For SHIPPING_PENDING (6), add an optional “Nudge for shipment” that sends a message to the channel. For DELIVERY_PENDING (7), optionally send a chat message when the influencer marks as received (e.g. “Marked as received”) so the brand sees it in the thread.

**Done when:** The influencer can see the correct status and description for every state, and can perform Complete KYC, Nudge Brand for Payment, Mark as Received (product only), Upload Video, and Re-upload Video with the correct Firestore updates and no duplicate constants or state logic outside the shared modules.

---

## 1. Single source of truth

- **Firestore path:** `contracts/<streamChannelId>` (one doc per contract; `streamChannelId` is the chat channel id).
- **Key fields:** `status` (1–14), `paymentStatus?`, `shippingDetails?`, `releasePlan?`, `contractTimestamp`, plus existing fields (`userId`, `brandId`, `collaborationId`, etc.).
- **Do not duplicate:** State machine, labels, descriptions, or contract types. They live in shared modules; both apps must use the same imports.

---

## 2. Shared modules — what to use in Trendly-Users

### 2.1 `shared-constants` (contract-status)

**Path (in app):** `@/shared-constants/contract-status` or your alias to the shared-constants package.

**Import and use:**

- **`ContractStatus`** — enum 1–14 (e.g. `ContractStatus.VIDEO_PENDING`, `ContractStatus.REVISION_PENDING`).
- **`CONTRACT_STATUS_LABELS`** — human-readable label per status (for any custom UI; primary use is via ContractStatusView).
- **`getContractStatusDescription(status, actor)`** — description string for **influencer** when `actor === "influencer"`. Use for subtitles or helper text.
- **`ContractStatusActor`** — type `"brand" | "influencer"`; always pass `"influencer"` in this app.
- **`RELEASE_DATE_MAX_DAYS`** — 30 (if you need to validate or show max release date).
- **`ReleasePlanOption`** — type for `releasePlan.option` (read-only on influencer side).

**Status enum (1–14):**  
KYC_VERIFICATION(1), CONTRACT_PENDING(2), PAYMENT_PENDING(3), PAYMENT_FAILED(4), PAYMENT_SUCCESSFUL(5), SHIPPING_PENDING(6), DELIVERY_PENDING(7), VIDEO_PENDING(8), REVIEW_PENDING(9), REVISION_PENDING(10), RELEASE_PLANNING(11), RELEASE_SCHEDULED(12), VIDEO_POSTED(13), SETTLEMENT_DONE(14).  
Note: **PAYMENT_FAILED** has no influencer description (brand-only state).

### 2.2 `shared-uis` (contract-status)

**Path (in app):** `@/shared-uis/components/contract-status` or your alias to the shared-uis package.

**Import:** `ContractStatusView`, `ContractStatusViewProps`.

**Usage on contract details (or equivalent) screen:**

```tsx
<ContractStatusView
  status={normalizedStatus}
  actor="influencer"
  scheduledReleaseAt={contract.releasePlan?.scheduledReleaseAt}
  showDescription
/>
```

- **normalizedStatus:** Use the same `normalizeStatus(contract.status)` as below so legacy 0–3 map correctly.
- **actor:** Always `"influencer"` in this app.
- **scheduledReleaseAt:** From `contract.releasePlan?.scheduledReleaseAt` for RELEASE_SCHEDULED (12); the component shows “Video scheduled for release on: [date]”.
- No need for `overrideLabel` / `overrideDescription` unless you have a legacy influencer flow (same idea as Brands’ legacy handling).

ContractStatusView is theme-aware (useTheme, Colors); no layout or color changes needed in shared-uis for influencer.

### 2.3 `shared-libs` (Firestore models)

**Path (in app):** `@/shared-libs/firestore/trendly-pro/models/contracts` (and collaborations if you need to know product vs digital).

**Import and use:**

- **`IContracts`** — full contract document type.
- **`ContractShippingDetails`**, **`ContractReleasePlan`**, **ReleasePlanOption** — for typing; influencer mostly reads these.
- **Firestore:** Use the same `FirestoreDB` and `doc`/`updateDoc` (or your app’s Firestore wrapper) so you write to `contracts/<streamChannelId>`.

**Collaboration type (product vs digital):**  
From **collaboration** doc (e.g. `ICollaboration` from `@/shared-libs/.../collaborations`): `promotionSubject === "physical_product"` means product shipping (states 6–7 apply). Influencer app uses this only to show the right copy/actions (e.g. “Mark as Received” only for product collaborations).

---

## 3. Normalize legacy status (same as Brands)

Use this in Trendly-Users so status 0–3 from the old flow still map to the new state machine for display and actions:

```ts
import { ContractStatus } from "@/shared-constants/contract-status";

function normalizeStatus(status: number): number {
  if (status >= 1 && status <= 14) return status;
  if (status === 0) return ContractStatus.CONTRACT_PENDING;
  if (status === 1) return ContractStatus.CONTRACT_PENDING;
  if (status === 2) return ContractStatus.REVIEW_PENDING;
  if (status === 3) return ContractStatus.SETTLEMENT_DONE;
  return ContractStatus.CONTRACT_PENDING;
}
```

Use **normalized status** for:
- Passing to `ContractStatusView`
- Deciding which influencer actions to show
- Any conditional copy (e.g. “Re-upload video” vs “Upload video”)

---

## 4. Influencer-side actions by status (what to implement)

Below: status → what the **influencer** can do and what to **write to Firestore** so both apps stay in sync. Same `contracts/<streamChannelId>` doc; only update the fields listed.

| Status | Name | Influencer action | Firestore update (from Trendly-Users) |
|--------|------|-------------------|--------------------------------------|
| 1 | KYC_VERIFICATION | “Complete KYC” → navigate to existing KYC/verification flow | No contract write; gate is KYC completion (already in your app). |
| 2 | CONTRACT_PENDING | Show “Waiting for brand to confirm” / no primary action | Read-only. |
| 3 | PAYMENT_PENDING | “Nudge Brand for Payment” → send message in channel `streamChannelId` | No contract write; use chat API to send a predefined message. |
| 4 | PAYMENT_FAILED | — | Influencer does not see this state (brand-only). |
| 5 | PAYMENT_SUCCESSFUL | Informational only | Read-only. |
| 6 | SHIPPING_PENDING | Show “Shipment is pending from the brand.” Optional: “Nudge for shipment” via chat | Read-only (brand adds `shippingDetails` and moves to 7). |
| 7 | DELIVERY_PENDING | “Mark as Received” / “Upload Delivery Proof” | `updateDoc(contractRef, { status: ContractStatus.VIDEO_PENDING })`. Optionally send a chat message (e.g. “Marked as received”) so brand sees it. |
| 8 | VIDEO_PENDING | “Upload Video” → your upload flow | After upload + any backend processing: `updateDoc(contractRef, { status: ContractStatus.REVIEW_PENDING })`. |
| 9 | REVIEW_PENDING | “Video is under review.” No primary action | Read-only (brand approves or requests revision). |
| 10 | REVISION_PENDING | “Re-upload Video” → upload flow | After re-upload: `updateDoc(contractRef, { status: ContractStatus.REVIEW_PENDING })`. |
| 11 | RELEASE_PLANNING | “Release will be scheduled by the brand.” | Read-only. |
| 12 | RELEASE_SCHEDULED | Show release date (ContractStatusView shows it) | Read-only; optional “Change date” is brand-only. |
| 13 | VIDEO_POSTED | “Video has been posted.” | Read-only. |
| 14 | SETTLEMENT_DONE | “Contract closed. Settlement complete.” | Read-only. |

**Chat / nudge:** Use the same channel id `contract.streamChannelId` for all “Nudge” or “Send message” actions so the brand sees them in the same thread (Trendly-Brands uses the same channel for “Nudge Influencer” and messages).

---

## 5. Contract details screen in Trendly-Users (checklist)

- [ ] Load contract from Firestore: `contracts/<streamChannelId>` (streamChannelId from route/context).
- [ ] Load collaboration (and optionally user/brand) so you have `IContracts` + `ICollaboration` (for product vs digital).
- [ ] Compute `normalizedStatus = normalizeStatus(contract.status)`.
- [ ] Render **ContractStatusView** with `status={normalizedStatus}`, `actor="influencer"`, `scheduledReleaseAt={contract.releasePlan?.scheduledReleaseAt}`, `showDescription`.
- [ ] Per normalized status, show the influencer actions from the table above (Complete KYC, Nudge Brand, Mark as Received, Upload Video, Re-upload Video, etc.).
- [ ] All Firestore updates: `doc(FirestoreDB, "contracts", contract.streamChannelId)` and `updateDoc(contractRef, { ... })` with only the fields that change (e.g. `status`).
- [ ] After any update, refresh contract data so UI and status stay in real time with the Brands app.

---

## 6. Keeping both apps in sync

- **Same doc, same field names:** Both apps use `status` (1–14), `shippingDetails`, `releasePlan`, `contractTimestamp` from `shared-libs` models. Do not rename or add app-specific state fields that the other app must interpret.
- **Same normalization:** Use the same `normalizeStatus` logic so legacy 0–3 behave identically in both apps.
- **Same channel:** All chat/nudge actions use `contract.streamChannelId` so messages appear in the same thread for both parties.
- **No duplicate constants:** Labels and descriptions come from `shared-constants` and `ContractStatusView`; do not redefine them in Trendly-Users.

---

## 7. Quick reference — imports (Trendly-Users)

```ts
// Status and copy
import {
  ContractStatus,
  CONTRACT_STATUS_LABELS,
  getContractStatusDescription,
  type ContractStatusActor,
  type ReleasePlanOption,
  RELEASE_DATE_MAX_DAYS,
} from "@/shared-constants/contract-status";

// Status UI (badge + description + release date)
import { ContractStatusView } from "@/shared-uis/components/contract-status";

// Contract document and types
import {
  IContracts,
  type ContractShippingDetails,
  type ContractReleasePlan,
} from "@/shared-libs/firestore/trendly-pro/models/contracts";

// Optional: collaboration type (product vs digital)
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
```

Use this context file in the Trendly-Users app (e.g. in `.cursor/rules/` or `docs/`) so an agent or developer can implement and maintain the contract flow in accordance with the shared modules and keep behavior aligned with Trendly-Brands in real time.
