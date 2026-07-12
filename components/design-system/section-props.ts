import { IDesignSystem } from "@/shared-libs/firestore/trendly-pro/models/design-system";

/**
 * Every Design System section receives the current draft plus a shallow-merge
 * patcher. A section reads its own slice off `ds` and writes just that slice back
 * via `onPatch({ <slice>: next })`; the hook handles dirty-tracking and saving.
 */
export interface SectionProps {
    ds: IDesignSystem;
    onPatch: (patch: Partial<IDesignSystem>) => void;
}
