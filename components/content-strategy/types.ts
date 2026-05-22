export type ScreenState = 'empty' | 'collecting' | 'strategy-ready';

export interface ChatMessage {
    id: string;
    sender: 'ai' | 'user';
    text: string;
    timestamp: number;
}

export interface ContentStrategy {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    chatMessages: ChatMessage[];
}
