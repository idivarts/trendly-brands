import type { ChatMessage, FocusItem } from "@/components/shared/AIChatPanel";

export type { ChatMessage, FocusItem };

export type ScreenState = 'empty' | 'collecting' | 'strategy-ready';

export interface ContentStrategy {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    chatMessages: ChatMessage[];
}
