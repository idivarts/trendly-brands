/**
 * FirestoreYjsProvider — a custom Yjs provider that syncs a Lexical
 * `CollaborationPlugin` document over Firestore, with no third-party realtime
 * vendor (Roadmap ticket 37542d5f…cdd28, Phase 2).
 *
 * Transport model — an append-only log under
 *   brands/{brandId}/strategies/{strategyId}/yupdates/{updateId}
 * Each doc is either a base64 Yjs *delta* or a periodic *snapshot*
 * (`isSnapshot: true`). Because Yjs is a CRDT, the order updates are applied in
 * does not affect convergence, so we order only loosely by `createdAt`.
 *
 * Awareness (live cursors/selections) rides on the existing
 *   brands/{brandId}/strategies/{strategyId}/presence/{managerId}
 * doc as a base64 `awareness` field.
 *
 * This file is web-only (imported from RichTextEditor.web.tsx) so DOM globals
 * (btoa/atob) are available.
 */

import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    Timestamp,
    where,
    type DocumentData,
} from "firebase/firestore";
import {
    applyAwarenessUpdate,
    Awareness,
    encodeAwarenessUpdate,
    removeAwarenessStates,
} from "y-protocols/awareness";
import * as Y from "yjs";

// ── tunables ────────────────────────────────────────────────────────────────
/** Local Yjs updates are buffered and flushed as ONE merged delta doc. */
const FLUSH_DEBOUNCE_MS = 500;
/** Compact once the live delta count crosses this (keeps the log bounded). */
const COMPACTION_THRESHOLD = 200;
/** Min gap between compactions (claimed transactionally on the strategy doc). */
const COMPACTION_COOLDOWN_MS = 60_000;
/** Awareness states whose presence heartbeat is older than this are dropped. */
const AWARENESS_TTL_MS = 30_000;

// ── base64 <-> bytes (Yjs updates are binary) ────────────────────────────────
function bytesToB64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}
function b64ToBytes(b64: string): Uint8Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

type Listener = (...args: unknown[]) => void;

export interface FirestoreProviderOptions {
    brandId: string;
    strategyId: string;
    managerId: string;
    name: string;
    /**
     * The strategy's `crdtGeneration` at the moment this provider was created.
     * Every yupdate we write is tagged with this value, and we ignore any
     * yupdate whose `generation` does not match. This prevents a freshly
     * re-bootstrapped editor (after an AI rewrite or native release) from
     * applying leftover deltas from the previous generation that haven't
     * been pruned yet — the race that used to clobber AI-written content.
     */
    generation: number;
}

export class FirestoreYjsProvider {
    public awareness: Awareness;

    private doc: Y.Doc;
    private opts: FirestoreProviderOptions;
    private listeners: Record<string, Set<Listener>> = {};

    private connected = false;
    private destroyed = false;

    private unsubUpdates: (() => void) | null = null;
    private unsubPresence: (() => void) | null = null;

    // Buffered local updates awaiting a debounced flush to Firestore.
    private pending: Uint8Array[] = [];
    private flushTimer: ReturnType<typeof setTimeout> | null = null;

    // yupdate doc IDs we have already applied (incl. our own writes) so the live
    // listener never re-applies the same delta.
    private appliedIds = new Set<string>();
    // Count of live (non-snapshot) deltas — drives compaction.
    private deltaCount = 0;

    private docUpdateHandler: (update: Uint8Array, origin: unknown) => void;
    private awarenessUpdateHandler: (
        changes: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown
    ) => void;

    constructor(ydoc: Y.Doc, opts: FirestoreProviderOptions) {
        this.doc = ydoc;
        this.opts = opts;
        this.awareness = new Awareness(ydoc);

        // Local doc edit → buffer for Firestore (ignore updates WE applied from
        // Firestore, tagged with origin === this).
        this.docUpdateHandler = (update, origin) => {
            if (origin === this || this.destroyed) return;
            this.pending.push(update);
            this.scheduleFlush();
        };

        // Local awareness change → push to our presence doc (ignore remote-applied
        // changes, tagged origin === "firestore").
        this.awarenessUpdateHandler = (_changes, origin) => {
            if (origin === "firestore" || this.destroyed) return;
            void this.broadcastAwareness();
        };
    }

    // ── tiny event emitter (matches @lexical/yjs Provider shape) ──────────────
    on(type: string, cb: Listener): void {
        (this.listeners[type] ??= new Set()).add(cb);
    }
    off(type: string, cb: Listener): void {
        this.listeners[type]?.delete(cb);
    }
    private emit(type: string, ...args: unknown[]): void {
        this.listeners[type]?.forEach((cb) => cb(...args));
    }

    // ── Firestore refs ────────────────────────────────────────────────────────
    private get yupdatesCol() {
        const { brandId, strategyId } = this.opts;
        return collection(FirestoreDB, "brands", brandId, "strategies", strategyId, "yupdates");
    }
    private get strategyRef() {
        const { brandId, strategyId } = this.opts;
        return doc(FirestoreDB, "brands", brandId, "strategies", strategyId);
    }
    private get presenceCol() {
        const { brandId, strategyId } = this.opts;
        return collection(FirestoreDB, "brands", brandId, "strategies", strategyId, "presence");
    }
    private get presenceRef() {
        return doc(this.presenceCol, this.opts.managerId);
    }

    // ── lifecycle ───────────────────────────────────────────────────────────
    async connect(): Promise<void> {
        if (this.connected || this.destroyed) return;
        this.connected = true;
        this.emit("status", { status: "connecting" });

        // Load existing state. If Firestore is unreachable or denied (e.g. the
        // yupdates rules/indexes aren't deployed yet) we must NOT let this reject
        // the whole connect — otherwise `sync` never fires, CollaborationPlugin
        // never binds, and the editor is stuck (can't type / bootstrap). Degrade
        // to a local-only doc instead.
        try {
            await this.loadInitial();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("[FirestoreYjsProvider] initial load failed (degrading to local)", e);
        }

        // Observe local changes only AFTER the initial state is applied, so the
        // bootstrap apply doesn't echo straight back to Firestore.
        this.doc.on("update", this.docUpdateHandler);
        this.awareness.on("update", this.awarenessUpdateHandler);

        try {
            this.subscribeTail();
            this.subscribePresence();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("[FirestoreYjsProvider] live subscription failed", e);
        }

        this.emit("status", { status: "connected" });
        // Always emit sync so CollaborationPlugin binds and (if owner) bootstraps
        // the doc from markdownContent — even when Firestore reads were denied.
        this.emit("sync", true);
    }

    disconnect(): void {
        this.destroyed = true;
        this.connected = false;
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
        // Best-effort final flush of anything still buffered.
        if (this.pending.length > 0) void this.flush();
        this.doc.off("update", this.docUpdateHandler);
        this.awareness.off("update", this.awarenessUpdateHandler);
        this.unsubUpdates?.();
        this.unsubPresence?.();
        this.unsubUpdates = null;
        this.unsubPresence = null;
        // Remove our awareness state + presence doc so cursors disappear.
        removeAwarenessStates(this.awareness, [this.doc.clientID], "local");
        void deleteDoc(this.presenceRef).catch(() => {});
        this.emit("status", { status: "disconnected" });
    }

    // ── initial load: latest snapshot + deltas after it ──────────────────────
    private async loadInitial(): Promise<void> {
        const all = await getDocs(query(this.yupdatesCol, orderBy("createdAt", "asc")));

        // Find the newest snapshot for *our* generation (if any); apply it first.
        // Snapshots from a previous generation are stale — they belong to a doc
        // body that has since been wholesale-rewritten and re-bootstrapped.
        let snapshotIdx = -1;
        let snapshotTimeMs = -1;
        all.docs.forEach((d, i) => {
            const data = d.data();
            if (!this.isCurrentGeneration(data)) return;
            if (data.isSnapshot) {
                const t = tsToMs(data.createdAt);
                if (t >= snapshotTimeMs) {
                    snapshotTimeMs = t;
                    snapshotIdx = i;
                }
            }
        });

        if (snapshotIdx >= 0) {
            const snap = all.docs[snapshotIdx];
            this.appliedIds.add(snap.id);
            Y.applyUpdate(this.doc, b64ToBytes(snap.data().update), this);
        }

        // Apply every delta created at/after the snapshot (order-independent for a CRDT).
        all.docs.forEach((d) => {
            if (this.appliedIds.has(d.id)) return;
            const data = d.data();
            this.appliedIds.add(d.id);
            if (!this.isCurrentGeneration(data)) return; // wrong generation — leftover from a prior baseline
            if (data.isSnapshot) return; // superseded older snapshot
            if (tsToMs(data.createdAt) < snapshotTimeMs) return; // folded into snapshot
            if (data.update) {
                Y.applyUpdate(this.doc, b64ToBytes(data.update), this);
                this.deltaCount++;
            }
        });
    }

    /**
     * True iff a yupdate doc belongs to the same generation as this provider.
     * Legacy yupdates written before the generation field existed are treated
     * as generation 0, matching the default we read for legacy strategy docs.
     */
    private isCurrentGeneration(data: DocumentData): boolean {
        const gen = typeof data.generation === "number" ? data.generation : 0;
        return gen === this.opts.generation;
    }

    // ── live tail subscription ────────────────────────────────────────────────
    private subscribeTail(): void {
        this.unsubUpdates = onSnapshot(this.yupdatesCol, (snap) => {
            snap.docChanges().forEach((change) => {
                if (change.type !== "added") return;
                const d = change.doc;
                if (this.appliedIds.has(d.id)) return;
                this.appliedIds.add(d.id);
                const data = d.data();
                if (!data.update) return;
                // Skip updates from a different generation — they belong to a
                // pre-AI-rewrite (or pre-native-release) baseline that the
                // editor has already moved on from. Applying them would clobber
                // the freshly-seeded content.
                if (!this.isCurrentGeneration(data)) return;
                if (!data.isSnapshot) this.deltaCount++;
                Y.applyUpdate(this.doc, b64ToBytes(data.update), this);
            });
            void this.maybeCompact();
        });
    }

    // ── local → Firestore (debounced, merged) ────────────────────────────────
    private scheduleFlush(): void {
        if (this.flushTimer) return;
        this.flushTimer = setTimeout(() => {
            this.flushTimer = null;
            void this.flush();
        }, FLUSH_DEBOUNCE_MS);
    }

    /**
     * Synchronously cancel any pending debounce and persist all buffered
     * deltas to Firestore now. Used by the manual-save (Ctrl+S) path to make
     * the converged CRDT state durable on demand.
     */
    async flushNow(): Promise<void> {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
        await this.flush();
    }

    private async flush(): Promise<void> {
        if (this.pending.length === 0) return;
        const merged = Y.mergeUpdates(this.pending);
        this.pending = [];
        try {
            const ref = await addDoc(this.yupdatesCol, {
                update: bytesToB64(merged),
                isSnapshot: false,
                clientId: this.doc.clientID,
                authorId: this.opts.managerId,
                generation: this.opts.generation,
                createdAt: serverTimestamp(),
            });
            // Our own write echoes back through the tail listener — pre-mark it
            // applied so it isn't re-applied (harmless, but wasteful).
            this.appliedIds.add(ref.id);
            this.deltaCount++;
        } catch (e) {
            // Re-buffer on failure so the edit isn't silently dropped.
            this.pending.unshift(merged);
            // eslint-disable-next-line no-console
            console.error("[FirestoreYjsProvider] flush failed", e);
        }
    }

    // ── awareness (cursors/selection) over the presence doc ───────────────────
    private async broadcastAwareness(): Promise<void> {
        try {
            const update = encodeAwarenessUpdate(this.awareness, [this.doc.clientID]);
            await setDoc(
                this.presenceRef,
                {
                    managerId: this.opts.managerId,
                    name: this.opts.name,
                    clientId: this.doc.clientID,
                    awareness: bytesToB64(update),
                    lastSeen: Date.now(),
                },
                { merge: true }
            );
        } catch {
            // Awareness is best-effort; a dropped cursor frame is harmless.
        }
    }

    private subscribePresence(): void {
        this.unsubPresence = onSnapshot(this.presenceCol, (snap) => {
            const now = Date.now();
            snap.docs.forEach((d) => {
                if (d.id === this.opts.managerId) return; // skip self
                const data = d.data() as DocumentData;
                if (!data.awareness) return;
                if (typeof data.lastSeen === "number" && now - data.lastSeen > AWARENESS_TTL_MS) {
                    return; // stale — let it expire instead of showing a ghost cursor
                }
                try {
                    applyAwarenessUpdate(this.awareness, b64ToBytes(data.awareness), "firestore");
                } catch {
                    /* ignore malformed awareness frames */
                }
            });
        });
    }

    // ── compaction: fold deltas into a single snapshot, prune the tail ────────
    private async maybeCompact(): Promise<void> {
        if (this.destroyed || this.deltaCount < COMPACTION_THRESHOLD) return;

        // Claim the compaction slot transactionally so only one client runs it.
        let claimed = false;
        try {
            await runTransaction(FirestoreDB, async (tx) => {
                const sref = this.strategyRef;
                const sdoc = await tx.get(sref);
                const last = (sdoc.data()?.crdtCompactAt as number | undefined) ?? 0;
                if (Date.now() - last < COMPACTION_COOLDOWN_MS) return; // someone just did it
                tx.update(sref, { crdtCompactAt: Date.now() });
                claimed = true;
            });
        } catch {
            return;
        }
        if (!claimed) return;

        try {
            // Snapshot the converged state, then delete everything older than it.
            const snapshotBytes = Y.encodeStateAsUpdate(this.doc);
            const cutoff = Timestamp.now();
            const snapRef = await addDoc(this.yupdatesCol, {
                update: bytesToB64(snapshotBytes),
                isSnapshot: true,
                clientId: this.doc.clientID,
                authorId: this.opts.managerId,
                generation: this.opts.generation,
                createdAt: serverTimestamp(),
            });
            this.appliedIds.add(snapRef.id);

            const stale = await getDocs(
                query(this.yupdatesCol, where("createdAt", "<", cutoff))
            );
            await Promise.all(stale.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
            this.deltaCount = 0;
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("[FirestoreYjsProvider] compaction failed", e);
        }
    }
}

function tsToMs(value: unknown): number {
    if (value instanceof Timestamp) return value.toMillis();
    if (typeof value === "number") return value;
    return -1; // unresolved serverTimestamp (pending) sorts oldest
}

/**
 * Builds the `providerFactory` that `CollaborationPlugin` expects. The plugin
 * owns the Y.Doc (via `yjsDocMap`); we attach a Firestore-backed provider to it.
 *
 * `onProvider` lets the caller capture a reference to the underlying
 * FirestoreYjsProvider instance — useful for manual-save plumbing (`flushNow`)
 * that has to reach past the @lexical/yjs Provider boundary.
 */
export function createFirestoreProviderFactory(
    opts: FirestoreProviderOptions,
    onProvider?: (provider: FirestoreYjsProvider) => void
) {
    return (id: string, yjsDocMap: Map<string, Y.Doc>) => {
        let ydoc = yjsDocMap.get(id);
        if (!ydoc) {
            ydoc = new Y.Doc();
            yjsDocMap.set(id, ydoc);
        } else {
            ydoc.load();
        }
        const provider = new FirestoreYjsProvider(ydoc, opts);
        onProvider?.(provider);
        // Cast at the boundary — the structural shape matches @lexical/yjs Provider.
        return provider as unknown as import("@lexical/yjs").Provider;
    };
}
