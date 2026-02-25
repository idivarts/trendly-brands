---
name: UI rule – Colors import (styles)
overview: "Replace `@/constants/Colors` with `@/shared-uis/constants/Colors` in all files under styles/. Part of UI rule violation audit (split); implement after Plan 01 (Phase 1)."
todos: []
isProject: false
---

# UI rule – Colors import (styles)

**Rule reference:** [.cursor/rules/ui-styling-theme-responsive.mdc](.cursor/rules/ui-styling-theme-responsive.mdc)

**Part of:** UI rule violation audit (split). Implement after Plan 01 (Phase 1).

## Task

Replace every import from `@/constants/Colors` with `@/shared-uis/constants/Colors` in the style files listed below.

## Files in scope (25)

- styles/button/Button.styles.tsx
- styles/brand-item/BrandItem.styles.tsx
- styles/collaboration-details/CollaborationDetails.styles.tsx
- styles/collaboration-details/CollaborationHeader.styles.tsx
- styles/CollaborationCard.styles.tsx
- styles/CollaborationCardStats.styles.tsx
- styles/CollaborationDetails.styles.tsx
- styles/CollaborationHistory.styles.tsx
- styles/create-collaboration/Screen.styles.tsx
- styles/FilterModal.styles.tsx
- styles/InfluencerCard.styles.tsx
- styles/menu/MenuItem.styles.tsx
- styles/modal/AddModal.styles.tsx
- styles/modal/ConfirmationModal.styles.tsx
- styles/Members.tsx
- styles/NotificationCard.styles.tsx
- styles/onboarding/brand.styles.tsx
- styles/onboarding/preference.styles.tsx
- styles/profile/ProfileCard.styles.tsx
- styles/profile/SocialPage.styles.tsx
- styles/Proposal.styles.tsx
- styles/searchbar/Searchbar.styles.tsx
- styles/tag/Tag.styles.tsx
- styles/tab1.styles.tsx
- styles/top-tab-navigation/TopTabNavigation.styles.tsx

## Done when

- Each file imports `Colors` from `@/shared-uis/constants/Colors`.
- No behavior change.
