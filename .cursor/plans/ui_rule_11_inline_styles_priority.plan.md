---
name: UI rule – Inline styles (high-priority)
overview: "Replace style={{ ... }} with named styles from StyleSheet.create (or theme-based factory) at bottom of file. High-priority files only. Part of UI rule violation audit (split); implement after Plan 10 (Phase 5)."
todos: []
isProject: false
---

# UI rule – Inline styles (high-priority)

**Rule reference:** [.cursor/rules/ui-styling-theme-responsive.mdc](.cursor/rules/ui-styling-theme-responsive.mdc)

**Part of:** UI rule violation audit (split). Implement after Plan 10 (Phase 5).

## Task

Rule: no inline style objects; use named styles from `StyleSheet` (or theme-based style factory) at the bottom of the file. Replace each `style={{ ... }}` with a reference to a named style defined in `StyleSheet.create(...)` or a theme-taking style factory in the same file.

## Files in scope (~12–15)

- components/collaboration/collaboration-details/ApplicationsTabContent.tsx
- components/drawer-layout/DrawerMenuContentWeb.tsx
- components/landing/pages/get-started.tsx
- components/paywall/index.tsx
- shared-uis/components/ProfileModal/Profile-Modal.tsx
- components/create-collaboration/screen-one.tsx
- components/create-collaboration/screen-two.tsx
- components/create-collaboration/screen-three.tsx
- components/explore-influencers/InfluencerConnects.tsx
- shared-uis/components/InfluencerCard.tsx
- components/ui/card/secondary/card-header.tsx
- components/collaboration/collaboration-details/OverviewTabContent.tsx

## Done when

- No inline `style={{ ... }}` objects in these files; all styles come from named entries in `StyleSheet.create` or a theme-based factory at the bottom of the file.
