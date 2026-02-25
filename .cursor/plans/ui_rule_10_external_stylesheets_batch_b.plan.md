---
name: UI rule – External stylesheets (batch B)
overview: "Move styles into component file or document exception for shared-uis ImagePicker, SearchInput, tag; DragAndDropNative; plus remaining consumers (card-header, multiselect-extendable, ConfirmationModal, NotificationCard, selector, BottomSheet, card-actions, TrendlyAdvancedFilter). Part of UI rule violation audit (split); implement after Plan 09 (Phase 4)."
todos: []
isProject: false
---

# UI rule – External stylesheets (batch B)

**Rule reference:** [.cursor/rules/ui-styling-theme-responsive.mdc](.cursor/rules/ui-styling-theme-responsive.mdc)

**Part of:** UI rule violation audit (split). Implement after Plan 09 (Phase 4).

## Task

Same as batch A: either move style logic into the consuming component file or keep a shared theme-taking module and document the exception. Ensure only `Colors(theme)`.

## Consumers and their external style imports

| Consumer | External style import(s) |
|---------|-------------------------|
| shared-uis/components/image-picker/ImagePicker.tsx | @/shared-uis/styles/image-picker/ImagePicker.styles |
| shared-uis/components/search-input/SearchInput.tsx | ../../styles/search-input/SearchInput.styles |
| shared-uis/components/tag/index.tsx | @/shared-uis/styles/tag/Tag.styles |
| shared-libs/functional-uis/grid/native/DragAndDropNative.tsx | DraggableGrid.styles |

**Other consumers** (fix or document): card-header, multiselect-extendable (async, index), ConfirmationModal, NotificationCard, selector, BottomSheet, card-actions, TrendlyAdvancedFilter, and any remaining imports from `styles/*` and `shared-uis/styles/*`. Discover via grep for imports matching `*.styles` or `*Styles`.

## Done when

- Each consumer either has styles in the same file or the exception is documented and the style module uses only `Colors(theme)`.
