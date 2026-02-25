---
name: UI rule – Inline styles (remaining)
overview: "Replace style={{ ... }} with named styles for remaining files. Scope by directory in batches of ~15–20 files. Part of UI rule violation audit (split); implement after Plan 11 (Phase 5)."
todos: []
isProject: false
---

# UI rule – Inline styles (remaining)

**Rule reference:** [.cursor/rules/ui-styling-theme-responsive.mdc](.cursor/rules/ui-styling-theme-responsive.mdc)

**Part of:** UI rule violation audit (split). Implement after Plan 11 (Phase 5).

## Task

Same as Plan 11: replace each `style={{ ... }}` with a named style from `StyleSheet.create(...)` or a theme-based factory in the same file. Work in batches of 15–20 files to avoid context overflow.

## How to find files

Run in repo root:

```bash
rg "style=\{\s*\{" --files-with-matches -g "*.tsx" -g "*.ts"
```

Exclude files already fixed in Plan 11. Then batch by directory, e.g.:

- **Batch 1:** components/collaboration (remaining), components/explore-influencers (remaining)
- **Batch 2:** app/, shared-uis/ (remaining)
- **Batch 3:** components/ (other dirs), shared-libs/

## Done when

- No inline style objects in the batched files; all styles from named `StyleSheet` or theme factory in the same file.
- Optionally run the grep again to confirm no remaining `style={{` in UI code (excluding comments/docs).
