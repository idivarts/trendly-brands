---
name: UI rule – Hardcoded colors (style-only files)
overview: "Ensure style-only files use only Colors(theme); remove lightgray, red, gray, white, black, etc. Part of UI rule violation audit (split); implement after Plan 07 (Phase 3)."
todos: []
isProject: false
---

# UI rule – Hardcoded colors (style-only files)

**Rule reference:** [.cursor/rules/ui-styling-theme-responsive.mdc](.cursor/rules/ui-styling-theme-responsive.mdc)

**Part of:** UI rule violation audit (split). Implement after Plan 07 (Phase 3).

## Task

These modules export style factories or `StyleSheet` helpers. Ensure they accept `theme` and use only `Colors(theme)`; remove any hardcoded colors (e.g. lightgray, red, `"gray"`, `'white'`, `'black'`).

## Files in scope (7)

- shared-libs/functional-uis/DraggableGrid.styles.tsx
- styles/collaboration-details/CollaborationDetails.styles.tsx
- styles/FilterModal.styles.tsx
- shared-uis/styles/carousel/AssetPreviewModal.styles.tsx
- shared-uis/styles/InfluencerCard.styles.tsx
- shared-uis/styles/search-input/SearchInput.styles.tsx
- shared-libs/functional-uis/grid/web/DraggableItem.style.tsx

## Done when

- Each file uses only `Colors(theme)` (no hex, rgb, rgba, or named colors).
- Call sites pass `theme` where required.
