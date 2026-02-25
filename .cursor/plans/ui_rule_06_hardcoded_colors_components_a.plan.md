---
name: UI rule – Hardcoded colors (components batch A)
overview: "Add useTheme() + Colors(theme) and remove hex/rgba/named colors in glass, landing, auth, kanban, pre-signin, drawer-layout, discover, brand-profile, BottomSheetActions, ui/bottom-sheet, app onboarding, app influencer-list, collaboration-applications. Part of UI rule violation audit (split); implement after Plan 05 (Phase 3)."
todos: []
isProject: false
---

# UI rule – Hardcoded colors (components batch A)

**Rule reference:** [.cursor/rules/ui-styling-theme-responsive.mdc](.cursor/rules/ui-styling-theme-responsive.mdc)

**Part of:** UI rule violation audit (split). Implement after Plan 05 (Phase 3).

## Task

Add `useTheme()` and derive colors via `Colors(theme)`. Replace all `#hex`, `rgb()`, `rgba()`, and named colors (e.g. `"white"`, `"red"`, `"gray"`) with tokens from [shared-uis/constants/Colors.ts](shared-uis/constants/Colors.ts). Reuse existing keys before adding new ones.

## Files in scope (~35)

**components/glass**
- components/glass/GlassButton.tsx
- components/glass/GlassCard.tsx

**components/landing**
- components/landing/OfferCard.tsx
- components/landing/pages/create-brand.tsx
- components/landing/pages/about-brand.tsx
- components/landing/pages/pricing-page.tsx

**components/auth**
- components/auth/AuthPageLayout.tsx

**components/kanban**
- components/kanban/BrandCRMBoard.tsx
- components/kanban/CollaborationCMSBoard.tsx

**components/pre-signin**
- components/pre-signin/LetsStartWeb.tsx
- components/pre-signin/ActionCard.tsx
- components/pre-signin/PreSigninWeb.tsx
- components/pre-signin/PreSigninMobile.tsx

**components/drawer-layout**
- components/drawer-layout/DrawerMenuContentWeb.tsx

**components/discover**
- components/discover/DiscoverSurvey.tsx
- components/discover/DiscoverInfluencer.tsx
- components/discover/AdvancedFilterOverlay.tsx
- components/discover/trendly/EditSocialMetricsModal.tsx
- components/discover/empty-screens/EmptyDiscoverPhyllo.tsx
- components/discover/empty-screens/EmptyDiscoverModash.tsx

**components/brand-profile**
- components/brand-profile/index.tsx

**components**
- components/BottomSheetActions.tsx
- components/ui/bottom-sheet/BottomSheet.tsx
- components/collaboration-applications/InfluencerApplications.tsx

**app**
- app/(main)/(onboarding)/onboarding-your-brand.tsx
- app/(public)/influencer-list.tsx

## Done when

- No hardcoded colors in these files; all from `Colors(theme)`.
- UI correct in light and dark themes.
