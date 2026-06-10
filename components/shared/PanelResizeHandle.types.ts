export interface PanelResizeHandleProps {
    /** Current panel width in px (drives ARIA valuenow). */
    widthPx: number;
    /** Clamp bounds in px (drive ARIA valuemin/valuemax + keyboard limits). */
    minPx: number;
    maxPx: number;
    /** Commit an absolute target panel width in px (hook clamps + persists). */
    onResize: (px: number) => void;
    /** Reset to the default width (double-click / Home is handled by caller). */
    onReset: () => void;
}
