---
name: UI rule – Colors import (components batch A)
overview: Replace `@/constants/Colors` with `@/shared-uis/constants/Colors` in components/channel, components/card, components/collaboration*, components/contracts, components/contract-card. Part of UI rule violation audit (split); implement after Plan 02 (Phase 1).
todos: []
isProject: false
---

# UI rule – Colors import (components batch A)

**Rule reference:** [.cursor/rules/ui-styling-theme-responsive.mdc](.cursor/rules/ui-styling-theme-responsive.mdc)

**Part of:** UI rule violation audit (split). Implement after Plan 02 (Phase 1).

## Task

Replace every import from `@/constants/Colors` with `@/shared-uis/constants/Colors` in the component files listed below.

## Files in scope (32)

**components/channel**

- components/channel/add-modal.tsx
- components/channel/channel-list.tsx
- components/channel/channel-list.web.tsx
- components/channel/channel.tsx
- components/channel/components/attach-button.tsx
- components/channel/components/send-button.tsx
- components/channel/components/attachment-picker-selection-bar.tsx
- components/channel/components/native-attachment-picker.tsx
- components/channel/components/more-options-button.tsx
- components/channel/components/audio-recording-button.tsx
- components/channel/components/commands-button.tsx

**components/card**

- components/card/collaboration-details/invitation-card.tsx
- components/card/profile-modal/invitation-card.tsx

**components/collaboration**

- components/collaboration/collaboration-details/modal/ManagerModal.tsx
- components/collaboration/collaboration-details/index.tsx
- components/collaboration/collaboration-details/InvitedMemberTabContent.tsx
- components/collaboration/collaboration-details/OverviewTabContent.tsx
- components/collaboration/collaboration-details/InvitationsTabContent.tsx
- components/collaboration/collaboration-details/modal/BrandModal.tsx
- components/collaboration/collaboration-details/ApplicationsTabContent.tsx
- components/collaboration/CollaborationHeader.tsx
- components/collaboration/CollaborationCard.tsx
- components/collaboration/create-collaboration/AddressAutocomplete.tsx
- components/collaboration/InviteToCampaignButton.tsx

**components/contracts**

- components/contracts/AddMemberModal.tsx
- components/contracts/ContractDetailContent.tsx
- components/contracts/active.tsx
- components/contracts/ActionContainer.tsx
- components/contracts/MemberContainer.tsx
- components/contracts/FeedbackModal.tsx

**components/contract-card**

- components/contract-card/ContractDetails.tsx
- components/contract-card/ContractHeader.tsx

## Done when

- Each file imports `Colors` from `@/shared-uis/constants/Colors`.
- No behavior change.

