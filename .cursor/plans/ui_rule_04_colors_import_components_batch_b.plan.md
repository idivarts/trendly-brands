---
name: UI rule – Colors import (components batch B)
overview: Replace `@/constants/Colors` with `@/shared-uis/constants/Colors` in remaining components (ui, drawer-layout, create-collaboration, menu, notifications, explore-influencers, discover, collaboration-card, brand-profile, profile, theme, FilterModal, SearchComponent, NotificationCard, ProfileItemCard, BottomSheetActions, paywall, settings, collaborations). Part of UI rule violation audit (split); implement after Plan 03 (Phase 1).
todos: []
isProject: false
---

# UI rule – Colors import (components batch B)

**Rule reference:** [.cursor/rules/ui-styling-theme-responsive.mdc](.cursor/rules/ui-styling-theme-responsive.mdc)

**Part of:** UI rule violation audit (split). Implement after Plan 03 (Phase 1).

## Task

Replace every import from `@/constants/Colors` with `@/shared-uis/constants/Colors` in the component files listed below.

## Files in scope (48)

**components/create-collaboration**

- components/create-collaboration/index.tsx
- components/create-collaboration/screen-one.tsx
- components/create-collaboration/screen-two.tsx
- components/create-collaboration/screen-three.tsx
- components/create-collaboration/screen-four.tsx
- components/create-collaboration/PreviewCollaboration.tsx
- components/create-collaboration/screen-layout.tsx

**components/drawer-layout**

- components/drawer-layout/DrawerMenuContent.tsx
- components/drawer-layout/DrawerMenuContentWeb.tsx
- components/drawer-layout/DrawerMenuItem.tsx
- components/drawer-layout/BrandActionItem.tsx
- components/drawer-layout/BrandItem.tsx

**components/ui**

- components/ui/back-button/BackButton.tsx
- components/ui/brand-switcher/index.tsx
- components/ui/button/social-button.tsx
- components/ui/card/secondary/index.tsx
- components/ui/card/secondary/card-actions.tsx
- components/ui/card/secondary/card-description.tsx
- components/ui/card/secondary/card-footer.tsx
- components/ui/card/secondary/card-header.tsx
- components/ui/card/tertiary/index.tsx
- components/ui/card/tertiary/card-files.tsx
- components/ui/card/tertiary/card-header.tsx
- components/ui/card/tertiary/card-metadata.tsx
- components/ui/card/tertiary/card-questions.tsx
- components/ui/drawer-toggle-button/DrawerToggleButton.tsx
- components/ui/menu-icon/index.tsx
- components/ui/screen-header/index.tsx
- components/ui/select/index.tsx
- components/ui/text-input/index.tsx
- components/ui/top-tab-navigation/index.tsx

**Other components**

- components/FilterModal.tsx
- components/NotificationCard.tsx
- components/SearchComponent.tsx
- components/ProfileItemCard.tsx
- components/BottomSheetActions.tsx
- components/members/index.tsx
- components/menu/index.tsx
- components/settings/index.tsx
- components/profile/index.tsx
- components/theme/Themed.tsx
- components/notifications/notification-icon.tsx
- components/paywall/CancelPlanModal.tsx
- components/collaborations/Collaborations.tsx
- components/brand-profile/members-card/index.tsx
- components/discover/DiscoverHeader.tsx
- components/discover/trendly/EditSocialMetricsModal.tsx
- components/discover/trendly/TrendlyAnalyticsEmbed.tsx
- components/explore-influencers/index.tsx
- components/explore-influencers/header.tsx
- components/explore-influencers/profile-icon.tsx
- components/collaboration-card/card-components/CollaborationHeader.tsx
- components/collaboration-card/card-components/CollaborationDetails.tsx
- components/collaboration-card/card-components/CollaborationStats.tsx
- components/collaboration-card/card-components/ChipComponent.tsx
- components/pre-signin/PreSigninMobile.tsx

## Done when

- Each file imports `Colors` from `@/shared-uis/constants/Colors`.
- No behavior change.

