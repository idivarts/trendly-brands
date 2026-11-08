# `design-stage` — what is left of it

The **DesignStage** this folder is named after is gone. It was the editor for a
design held as ONE html document with N `[data-slide]` nodes inside it, which is
why it could not reorder a scene, delete one, or regenerate scene four: a
"scene" was a node in a file, so every structural edit rewrote the whole
document. The Design Studio makes a scene a *document*, and designing now
happens there (`app/(main)/(studio)/design-studio`, `components/studio/`).

What survives here is the **frame machinery** the studio and the MediaStage both
still need, and it is shared rather than legacy:

| file | used by |
|---|---|
| `DesignFrame.tsx` / `.web.tsx` | `StudioStage`, `MediaStage` |
| `bridge.ts` | both DesignFrames, `StudioStage`, `MediaStage` |
| `composition-edits.ts` | `MediaStage`, its own tests |
| `use-content-composition.ts` | `MediaStage` |
| `use-design-preview.ts` | `MediaStage`, the content route |
| `use-design-render.ts` | `MediaStage`, `DesignRenderBar` |
| `use-footage-asset.ts` | `MediaStage` |

**The folder name is now wrong and is kept deliberately**, because renaming it
touches ten import sites across two features for no behavioural gain — and a
rename landing in the same change as a 5,500-line deletion would make that
deletion much harder to read. Rename it on its own, when somebody is next in
here.

`bridge.ts` is the one to be careful with: it is injected into every design
frame, and the chrome and bridge it adds **must not** end up in a saved
document. See its own `serialize()` note.
