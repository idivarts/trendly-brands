# Contract + Payment Flow — Context for Trendly-Users App

Use this file as **agent/developer context** when implementing or maintaining the contract-with-payment flow in **Trendly-Users**. The flow is shared with **Trendly-Brands** via three shared modules; both apps read/write the **same Firestore contract document**. KYC/verification is already implemented in Trendly-Users; this doc focuses on **contract status UI** and **influencer-side actions** so the flow works in real time in both apps.

---

## Tasks to do after reading this context

After reading this document, implement or verify the following in **Trendly-Users**:

1. **Contract details (or equivalent) screen**
   - Ensure the screen loads the contract from Firestore (`contracts/<streamChannelId>`) and the collaboration doc (for product vs digital). Use `streamChannelId` from the route or context.
   - Add or reuse a `normalizeStatus(contract.status)` helper (Section 3) for 0–10 and use it everywhere you derive status for UI or actions.

2. **KYC gate (not a state)**
   - Use **`isContractBlockedByKYC(userData)`** from shared-constants. When status is Pending (0) and `isContractBlockedByKYC(userData)` is true, show “Complete KYC to start the contract” and do **not** show Make Payment / Start Contract or other contract actions. Navigate to KYC when the user taps “Complete KYC”. Do not write any contract status for KYC.

3. **Status display**
   - On the contract details screen, render **ContractStatusView** from `@/shared-uis/components/contract-status` with `status={normalizedStatus}`, `actor="influencer"`, `scheduledReleaseAt={contract.posting?.scheduledDate}`, and `showDescription`. Do not build a custom status badge/label; use this shared component.

4. **Influencer actions by status (0–10)**
   - For each normalized status, show the correct influencer action(s) as in the table in Section 4. Implement at least:
     - **Pending (0) and KYC not done:** “Complete KYC” → navigate to KYC (no contract write).
     - **Pending (0):** “Nudge Brand for Payment” → send a message to channel `contract.streamChannelId` (no contract write).
     - **Delivered (5):** “Mark as Received” (product only) → `updateDoc(contractRef, { status: ContractStatus.Received })`.
     - **Received (6) / DeliverableSent (7):** “Upload Video” or “Re-upload Video” → after upload → `updateDoc(contractRef, { status: ContractStatus.DeliverableSent })`. Refresh contract data.
   - For all other statuses, show informational copy only (no write). Do not show PaymentFailed (2) to the influencer.

5. **Firestore and types**
   - Use `doc(FirestoreDB, "contracts", contract.streamChannelId)` and `updateDoc(contractRef, { ... })` for any contract update. Type the contract as `IContracts` and use `ContractStatus` (0–10) from shared-constants. Do not add new fields that the Brands app does not expect.

6. **Sync and consistency**
   - After every contract update, refresh the contract so the UI stays in sync with Trendly-Brands. Use the same channel id (`streamChannelId`) for all chat/nudge actions.

**Done when:** The influencer sees the correct status for every state (0–10), the KYC gate blocks contract start until KYC is done, and they can perform Complete KYC, Nudge Brand for Payment, Mark as Received (product only), Upload Video, and Re-upload Video with the correct Firestore updates.

---

## 1. Single source of truth

- **Firestore path:** `contracts/<streamChannelId>` (one doc per contract; `streamChannelId` is the chat channel id).
- **Key fields:** `status` (0–10), `payment?`, `shipment?`, `deliverable?`, `posting?` (e.g. `posting.scheduledDate`), `contractTimestamp`, plus existing fields (`userId`, `brandId`, `collaborationId`, etc.).
- **KYC is a gate, not a state:** Do not allow starting the campaign/contract until influencer KYC is done; use `isContractBlockedByKYC(user)` in the UI. The contract status is never set to a “KYC” value.
- **Do not duplicate:** State machine (0–10), labels, descriptions, or contract types. They live in shared modules; both apps must use the same imports.

---

## 2. Shared modules — what to use in Trendly-Users

### 2.1 `shared-constants` (contract-status)

**Path (in app):** `@/shared-constants/contract-status` or your alias to the shared-constants package.

**Import and use:**

- **`ContractStatus`** — enum 0–10 (e.g. `ContractStatus.Pending`, `ContractStatus.DeliverableSent`, `ContractStatus.Received`).
- **`isContractBlockedByKYC(user)`** — returns true if contract actions should be blocked because influencer KYC is not done (gate only; not a contract state).
- **`CONTRACT_STATUS_LABELS`** — human-readable label per status (for any custom UI; primary use is via ContractStatusView).
- **`getContractStatusDescription(status, actor)`** — description string for **influencer** when `actor === "influencer"`. Use for subtitles or helper text.
- **`ContractStatusActor`** — type `"brand" | "influencer"`; always pass `"influencer"` in this app.
- **`RELEASE_DATE_MAX_DAYS`** — 30 (if you need to validate or show max release date).
- **`ReleasePlanOption`** — type for posting scenario (read-only on influencer side).

**Status enum (0–10):**  
Pending(0), Started(1), PaymentFailed(2), Paid(3), Shipped(4), Delivered(5), Received(6), DeliverableSent(7), PostScheduled(8), PostDone(9), Settled(10).  
Note: **PaymentFailed (2)** has no influencer description (brand-only state). **KYC is not a state** — use `isContractBlockedByKYC` to block actions until KYC is done.

### 2.2 `shared-uis` (contract-status)

**Path (in app):** `@/shared-uis/components/contract-status` or your alias to the shared-uis package.

**Import:** `ContractStatusView`, `ContractStatusViewProps`.

**Usage on contract details (or equivalent) screen:**

```tsx
<ContractStatusView
  status={normalizedStatus}
  actor="influencer"
  scheduledReleaseAt={contract.posting?.scheduledDate}
  showDescription
/>
```

- **normalizedStatus:** Use the same `normalizeStatus(contract.status)` as below (0–10).
- **actor:** Always `"influencer"` in this app.
- **scheduledReleaseAt:** From `contract.posting?.scheduledDate` for PostScheduled (8); the component shows “Video scheduled for release on: [date]”.
- No need for `overrideLabel` / `overrideDescription` unless you have a legacy influencer flow.

ContractStatusView is theme-aware (useTheme, Colors); no layout or color changes needed in shared-uis for influencer.

### 2.3 `shared-libs` (Firestore models)

**Path (in app):** `@/shared-libs/firestore/trendly-pro/models/contracts` (and collaborations if you need to know product vs digital).

**Import and use:**

- **`IContracts`** — full contract document type (`status` 0–10, `payment?`, `shipment?`, `deliverable?`, `posting?`).
- **`Shipment`**, **`Posting`**, etc. — for typing; influencer mostly reads these.
- **Firestore:** Use the same `FirestoreDB` and `doc`/`updateDoc` (or your app’s Firestore wrapper) so you write to `contracts/<streamChannelId>`.

**Collaboration type (product vs digital):**  
From **collaboration** doc (e.g. `ICollaboration` from `@/shared-libs/.../collaborations`): `promotionSubject === "physical_product"` means product shipping (Shipped/Delivered/Received apply). Use this to show “Mark as Received” only for product collaborations.

---

## 3. Normalize legacy status (same as Brands)

Use this in Trendly-Users so status 0–10 is used for display and actions (legacy 2/3 map to 7/10 if needed):

```ts
import { ContractStatus } from "@/shared-constants/contract-status";

function normalizeStatus(status: number): number {
  if (status >= 0 && status <= 10) return status;
  if (status === 2) return ContractStatus.DeliverableSent;
  if (status === 3) return ContractStatus.Settled;
  return ContractStatus.Pending;
}
```

Use **normalized status** for:
- Passing to `ContractStatusView`
- Deciding which influencer actions to show
- Any conditional copy (e.g. “Re-upload video” vs “Upload video”)

---

## 4. Influencer-side actions by status (0–10, what to implement)

Below: status → what the **influencer** can do and what to **write to Firestore** so both apps stay in sync. Same `contracts/<streamChannelId>` doc; only update the fields listed. **KYC is a gate:** when status is Pending (0) and `isContractBlockedByKYC(user)` is true, show “Complete KYC” and do not allow other contract actions (no contract write).

| Status | Name | Influencer action | Firestore update (from Trendly-Users) |
|--------|------|-------------------|--------------------------------------|
| 0 | Pending | If KYC not done: “Complete KYC” → navigate to KYC. Else: “Nudge Brand for Payment” via chat | No contract write for KYC or nudge. |
| 1 | Started | Informational | Read-only. |
| 2 | PaymentFailed | — | Influencer does not see this state (brand-only). |
| 3 | Paid | Informational | Read-only. |
| 4 | Shipped | Show “Shipment is pending from the brand.” Optional: “Nudge for shipment” via chat | Read-only. |
| 5 | Delivered | “Mark as Received” (product only) | `updateDoc(contractRef, { status: ContractStatus.Received })`. Optionally send chat message. |
| 6 | Received | “Upload Video” / “Nudge” / “Go to Messages” | After upload: `updateDoc(contractRef, { status: ContractStatus.DeliverableSent })`. |
| 7 | DeliverableSent | “Re-upload Video” or “Video is under review.” | After re-upload: `updateDoc(contractRef, { status: ContractStatus.DeliverableSent })`. |
| 8 | PostScheduled | Show release date (ContractStatusView shows it) | Read-only. |
| 9 | PostDone | “Video has been posted.” | Read-only. |
| 10 | Settled | “Contract closed. Settlement complete.” | Read-only. |

**Chat / nudge:** Use the same channel id `contract.streamChannelId` for all “Nudge” or “Send message” actions so the brand sees them in the same thread.

---

## 5. Contract details screen in Trendly-Users (checklist)

- [ ] Load contract from Firestore: `contracts/<streamChannelId>` (streamChannelId from route/context).
- [ ] Load collaboration (and optionally user/brand) so you have `IContracts` + `ICollaboration` (for product vs digital).
- [ ] Compute `normalizedStatus = normalizeStatus(contract.status)` (0–10).
- [ ] **KYC gate:** When `isContractBlockedByKYC(userData)` and status is Pending (0), show “Complete KYC to start the contract” and do not show Make Payment / Start Contract or other contract actions.
- [ ] Render **ContractStatusView** with `status={normalizedStatus}`, `actor="influencer"`, `scheduledReleaseAt={contract.posting?.scheduledDate}`, `showDescription`.
- [ ] Per normalized status, show the influencer actions from the table above (Complete KYC when blocked, Nudge Brand, Mark as Received, Upload Video, Re-upload Video, etc.).
- [ ] All Firestore updates: `doc(FirestoreDB, "contracts", contract.streamChannelId)` and `updateDoc(contractRef, { ... })` with only the fields that change (e.g. `status`).
- [ ] After any update, refresh contract data so UI and status stay in real time with the Brands app.

---

## 6. Keeping both apps in sync

- **Same doc, same field names:** Both apps use `status` (0–10), `payment`, `shipment`, `deliverable`, `posting`, `contractTimestamp` from `shared-libs` models. Do not rename or add app-specific state fields that the other app must interpret.
- **KYC as gate only:** Both apps use `isContractBlockedByKYC(user)` to block starting the campaign/contract until influencer KYC is done; KYC is not a contract state.
- **Same normalization:** Use the same `normalizeStatus` logic (0–10, with legacy mapping if needed) so both apps behave identically.
- **Same channel:** All chat/nudge actions use `contract.streamChannelId` so messages appear in the same thread for both parties.
- **No duplicate constants:** Labels and descriptions come from `shared-constants` and `ContractStatusView`; do not redefine them in Trendly-Users.

---

## 7. Quick reference — imports (Trendly-Users)

```ts
// Status and copy (0–10, KYC gate)
import {
  ContractStatus,
  isContractBlockedByKYC,
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
  type Shipment,
  type Posting,
} from "@/shared-libs/firestore/trendly-pro/models/contracts";

// Optional: collaboration type (product vs digital)
import { ICollaboration } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
```

Use this context file in the Trendly-Users app (e.g. in `.cursor/rules/` or `docs/`) so an agent or developer can implement and maintain the contract flow in accordance with the shared modules and keep behavior aligned with Trendly-Brands in real time.
