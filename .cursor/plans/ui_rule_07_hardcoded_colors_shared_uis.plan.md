---
name: UI rule – Hardcoded colors (shared-uis)
overview: "Add useTheme() + Colors(theme) and remove hex/rgba/named colors in shared-uis: CustomDrawer, carousel, feedback-modal, application-action-card, bottom-sheet, image-component, SearchInput. Part of UI rule violation audit (split); implement after Plan 06 (Phase 3)."
todos: []
isProject: false
---

# UI rule – Hardcoded colors (shared-uis)

**Rule reference:** [.cursor/rules/ui-styling-theme-responsive.mdc](.cursor/rules/ui-styling-theme-responsive.mdc)

**Part of:** UI rule violation audit (split). Implement after Plan 06 (Phase 3).

## Task

Add `useTheme()` and derive colors via `Colors(theme)`. Replace all `#hex`, `rgba()`, and named colors with tokens from [shared-uis/constants/Colors.ts](shared-uis/constants/Colors.ts).

## Files in scope (12)

- shared-uis/components/CustomDrawer/index.tsx
- shared-uis/components/carousel/asset-preview-modal.web.tsx
- shared-uis/components/carousel/render-media-item.tsx
- shared-uis/components/scroller/CarouselScroller.tsx
- shared-uis/components/feedback-modal/index.tsx
- shared-uis/components/application-action-card.tsx
- shared-uis/components/bottom-sheet/index.tsx
- shared-uis/components/bottom-sheet/scroll-view.tsx
- shared-uis/components/image-component/index.tsx
- shared-uis/components/search-input/SearchInput.tsx

## Done when

- No hardcoded colors in these files; all from `Colors(theme)`.
- UI correct in light and dark themes.
