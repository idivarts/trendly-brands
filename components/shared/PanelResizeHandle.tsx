/**
 * PanelResizeHandle (native no-op)
 *
 * Drag-to-resize only exists on web. On native there is no pointer-driven
 * splitter, so this renders nothing. The real implementation lives in
 * PanelResizeHandle.web.tsx (Metro picks the .web variant on web).
 */
import type { PanelResizeHandleProps } from "./PanelResizeHandle.types";

const PanelResizeHandle = (_props: PanelResizeHandleProps) => null;

export default PanelResizeHandle;
