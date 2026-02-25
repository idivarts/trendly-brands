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

## Completed (batch B)

- **ImagePicker**: Styles inlined into `shared-uis/components/image-picker/ImagePicker.tsx`; removed external stylesheet.
- **SearchInput**: Styles inlined into `shared-uis/components/search-input/SearchInput.tsx`; removed external stylesheet.
- **Tag** (shared-uis): Styles inlined into `shared-uis/components/tag/index.tsx`; removed external stylesheet.
- **DragAndDropNative**: Exception documented in `DraggableGrid.styles.tsx` (shared by DragAndDropNative, DraggableItem, AssetRender); uses only `Colors(theme)`.
- **SelectGroup** (selector): Styles inlined into `shared-uis/components/select/select-group.tsx`; removed external stylesheet.
- **NotificationCard**: Replaced inline style with `styles.loader`.
- **BottomSheet** (components/ui): Replaced hardcoded overlay with `Colors(theme).backdrop`.
- **FilterModal**: Styles inlined into `components/FilterModal.tsx`; removed external stylesheet.
