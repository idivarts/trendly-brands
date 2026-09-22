/**
 * use-design-system
 *
 * Subscribes to the brand's single Design System document
 * (`brands/{brandId}/designSystem/main`) and exposes a local editable draft with
 * dirty tracking + an explicit `save()` — the same "don't clobber my edits"
 * guarantee the content/variations editors give.
 *
 * There is exactly one Design System per brand (the doc id is fixed to "main"),
 * so this is a single-document editor, not a collection. The live subscription is
 * the server source of truth and reseeds the draft EXCEPT while the user has
 * unsaved local edits, which are preserved until the next save.
 *
 * The whole draft is written on save (full overwrite, not merge) so that fields
 * the user cleared — a removed color, an emptied section — are dropped from
 * Firestore rather than lingering. Writes go directly through the client
 * Firestore path, which the security rules allow for content managers (see
 * firestore.rules → brands/{brandId}/designSystem/{docId}).
 */
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import {
    DESIGN_SYSTEM_DOC_ID,
    IDesignSystem,
} from "@/shared-libs/firestore/trendly-pro/models/design-system";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseDesignSystemReturn {
    /** The last-saved server document (read-only reference). */
    serverDesignSystem: IDesignSystem | null;
    /** The local editable draft the UI mutates. */
    draft: IDesignSystem;
    /** True while the first snapshot is loading. */
    loading: boolean;
    /** True while a save is in flight. */
    saving: boolean;
    /** True while the draft differs from the server document. */
    dirty: boolean;
    /** Merge a shallow patch into the draft (marks dirty). */
    patch: (patch: Partial<IDesignSystem>) => void;
    /** Replace the whole draft via an updater (marks dirty). */
    update: (updater: (prev: IDesignSystem) => IDesignSystem) => void;
    /** Flush the draft to Firestore (full overwrite). Resolves when persisted. */
    save: () => Promise<void>;
    /** Discard local edits and reseed from the server document. */
    reset: () => void;
}

const EMPTY: IDesignSystem = {};

export function useDesignSystem(): UseDesignSystemReturn {
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();
    const brandId = selectedBrand?.id;

    const [serverDesignSystem, setServerDesignSystem] = useState<IDesignSystem | null>(null);
    const [draft, setDraft] = useState<IDesignSystem>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    // Refs so the snapshot handler reads the latest dirty flag without
    // re-subscribing, and so save() reads the latest draft.
    const dirtyRef = useRef(dirty);
    dirtyRef.current = dirty;
    const draftRef = useRef(draft);
    draftRef.current = draft;

    const docRef = useMemo(() => {
        if (!brandId) return null;
        return doc(FirestoreDB, "brands", brandId, "designSystem", DESIGN_SYSTEM_DOC_ID);
    }, [brandId]);

    useEffect(() => {
        if (!docRef) {
            setServerDesignSystem(null);
            setDraft(EMPTY);
            setDirty(false);
            setLoading(false);
            return;
        }
        setLoading(true);
        const unsubscribe = onSnapshot(
            docRef,
            (snap) => {
                const data = (snap.exists() ? (snap.data() as IDesignSystem) : {}) ?? {};
                setServerDesignSystem(data);
                // Only reseed the editable draft when the user has no unsaved edits,
                // so an incoming snapshot never clobbers what they're typing.
                if (!dirtyRef.current) {
                    setDraft(data);
                }
                setLoading(false);
            },
            () => setLoading(false)
        );
        return () => unsubscribe();
    }, [docRef]);

    const patch = useCallback((p: Partial<IDesignSystem>) => {
        setDraft((prev) => ({ ...prev, ...p }));
        setDirty(true);
    }, []);

    const update = useCallback((updater: (prev: IDesignSystem) => IDesignSystem) => {
        setDraft((prev) => updater(prev));
        setDirty(true);
    }, []);

    const reset = useCallback(() => {
        setDraft(serverDesignSystem ?? EMPTY);
        setDirty(false);
    }, [serverDesignSystem]);

    const save = useCallback(async () => {
        if (!docRef) return;
        setSaving(true);
        try {
            const payload: IDesignSystem = {
                ...draftRef.current,
                updatedAt: Date.now(),
                updatedBy: manager?.id ?? draftRef.current.updatedBy,
            };
            // Full overwrite (not merge) so fields the user cleared are removed.
            await setDoc(docRef, stripUndefined(payload));
            setDirty(false);
        } finally {
            setSaving(false);
        }
    }, [docRef, manager?.id]);

    return {
        serverDesignSystem,
        draft,
        loading,
        saving,
        dirty,
        patch,
        update,
        save,
        reset,
    };
}

/**
 * Firestore rejects `undefined` values. The editor naturally produces them (an
 * un-set optional field), so deep-strip them before writing. Empty strings and
 * empty arrays are intentionally KEPT — they represent an explicit clear.
 */
function stripUndefined<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((v) => stripUndefined(v)) as unknown as T;
    }
    if (value && typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            if (v === undefined) continue;
            out[k] = stripUndefined(v);
        }
        return out as T;
    }
    return value;
}
