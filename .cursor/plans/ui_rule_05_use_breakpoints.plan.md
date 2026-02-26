---
name: UI rule – useBreakpoints (replace useWindowDimensions)
overview: "Replace useWindowDimensions() and Dimensions.get('window') with useBreakpoints() in the 17 component files listed. Part of UI rule violation audit (split); implement after Phase 1 (Plans 01–04)."
todos: []
isProject: false
---

# UI rule – useBreakpoints (Phase 2)

**Rule reference:** [.cursor/rules/ui-styling-theme-responsive.mdc](.cursor/rules/ui-styling-theme-responsive.mdc)

**Part of:** UI rule violation audit (split). Implement after Phase 1 (Colors import).

## Task

Use `useBreakpoints()` (and optionally `.width`) instead of `useWindowDimensions()` or `Dimensions.get("window")` in components. Only module-level utility code may use `getConstrainedWidth()` / `getConstrainedHeight()` from [shared-libs/contexts/mobile-layout-context.provider.tsx](shared-libs/contexts/mobile-layout-context.provider.tsx).

**Reference:** [shared-libs/utils/use-breakpoints.tsx](shared-libs/utils/use-breakpoints.tsx)

## Files in scope (17)

- components/brand-profile/index.tsx
- components/create-collaboration/screen-two.tsx
- components/pre-signin/PageTransition.tsx
- components/collaboration/collaboration-details/InvitationsTabContent.tsx
- components/collaboration/InviteToCampaignModal.tsx
- components/pre-signin/PreSigninMobile.tsx
- components/discover/trendly/TrendlyAnalyticsEmbed.tsx
- shared-uis/components/carousel/render-media-item.tsx
- components/collaboration/collaboration-details/ApplicationsTabContent.tsx
- components/auth/AuthPageLayout.tsx
- components/discover/AdvancedFilterOverlay.tsx
- components/explore-influencers/index.tsx
- components/collaboration/collaboration-details/InvitedMemberTabContent.tsx
- components/ui/top-tab-navigation/index.tsx
- components/ui/card/secondary/card-description.tsx
- components/discover/trendly/EditSocialMetricsModal.tsx
- components/discover/InfluencerStatModal.tsx

## Done when

- Each file uses `useBreakpoints()` (and `.width` where width was used) instead of `useWindowDimensions()` or `Dimensions.get("window")`.
- No direct `Dimensions.get("window")` in component bodies.
