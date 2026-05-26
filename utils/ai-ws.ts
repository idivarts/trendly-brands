import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { IS_DEV } from "@/shared-libs/utils/environment";

const DEFAULT_WS_URL = IS_DEV
    ? "wss://cuowcrxmii.execute-api.us-east-1.amazonaws.com/dev"
    : "wss://cuowcrxmii.execute-api.us-east-1.amazonaws.com/prod";

const WS_URL = process.env.EXPO_PUBLIC_AI_WS_URL || DEFAULT_WS_URL;

type Listener = (msg: any) => void;

class AIWebSocket {
    private ws: WebSocket | null = null;
    private listeners = new Set<Listener>();
    private connecting: Promise<void> | null = null;
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private intentionallyClosed = false;

    async connect(): Promise<void> {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
        if (this.connecting) return this.connecting;

        this.connecting = (async () => {
            const user = AuthApp?.currentUser;
            if (!user) throw new Error("not signed in");
            const token = await user.getIdToken();
            const url = `${WS_URL}?token=${encodeURIComponent(token)}`;

            this.intentionallyClosed = false;

            await new Promise<void>((resolve, reject) => {
                const ws = new WebSocket(url);
                this.ws = ws;
                ws.onopen = () => {
                    this.reconnectAttempts = 0;
                    resolve();
                };
                ws.onmessage = (ev) => {
                    let parsed: any = null;
                    try {
                        parsed = JSON.parse(ev.data);
                    } catch {
                        parsed = { type: "raw", data: ev.data };
                    }
                    this.listeners.forEach((l) => {
                        try {
                            l(parsed);
                        } catch {}
                    });
                };
                ws.onerror = () => reject(new Error("ws error"));
                ws.onclose = () => {
                    this.ws = null;
                    if (!this.intentionallyClosed) this.scheduleReconnect();
                };
            });
        })();

        try {
            await this.connecting;
        } finally {
            this.connecting = null;
        }
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) return;
        const delay = Math.min(30_000, 500 * 2 ** Math.min(this.reconnectAttempts, 6));
        this.reconnectAttempts += 1;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect().catch(() => this.scheduleReconnect());
        }, delay);
    }

    async send(payload: Record<string, any>): Promise<void> {
        await this.connect();
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error("ws not open");
        }
        this.ws.send(JSON.stringify({ action: "ai", ...payload }));
    }

    addListener(fn: Listener): () => void {
        this.listeners.add(fn);
        return () => {
            this.listeners.delete(fn);
        };
    }

    close() {
        this.intentionallyClosed = true;
        this.ws?.close();
        this.ws = null;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}

export const aiWS = new AIWebSocket();
