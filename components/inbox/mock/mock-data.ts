/**
 * MOCK ONLY — delete this file when removing the mock layer.
 *
 * Hand-crafted demo content for the Inbox. Timestamps are computed relative to
 * "now" at call time so the 24h DM reply-window logic demos correctly (some
 * threads are inside the window, one is expired).
 */
import {
    ConnectedInboxAccount,
    InboxConversation,
} from "../types";

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const MOCK_ACCOUNTS: ConnectedInboxAccount[] = [
    {
        id: "ig_1",
        channel: "instagram",
        name: "Glow Skincare",
        handle: "glow.skincare",
        avatarUrl: "https://i.pravatar.cc/150?img=47",
    },
    {
        id: "fb_1",
        channel: "facebook",
        name: "Glow Skincare",
        handle: "GlowSkincareOfficial",
        avatarUrl: "https://i.pravatar.cc/150?img=12",
    },
];

export function buildMockConversations(): InboxConversation[] {
    const now = Date.now();

    return [
        // --- Instagram DM, inside 24h window, unread ---
        {
            id: "c_ig_dm_1",
            kind: "dm",
            channel: "instagram",
            unread: true,
            participant: {
                id: "u_arpita",
                name: "Arpita Singh",
                handle: "arpita_creates",
                avatarUrl: "https://i.pravatar.cc/150?img=32",
            },
            preview: "Thank you, and I look forward to hearing from you!",
            lastActivityAt: now - 18 * MIN,
            replyWindowExpiresAt: now + (DAY - 18 * MIN),
            messages: [
                {
                    id: "m1",
                    author: "contact",
                    text: "Hi! I came across your page and really liked it.",
                    sentAt: now - 40 * MIN,
                },
                {
                    id: "m2",
                    author: "contact",
                    text: "I'm a model and content creator, and I'd love to collaborate with your brand. My content gets a good number of views and has a strong reach, so I can help promote your products to more people.",
                    sentAt: now - 38 * MIN,
                },
                {
                    id: "m3",
                    author: "contact",
                    text: "If you're open to collaborations, I'd be happy to share my profile insights, portfolio, and discuss ideas that could benefit both of us.",
                    sentAt: now - 22 * MIN,
                },
                {
                    id: "m4",
                    author: "contact",
                    text: "Thank you, and I look forward to hearing from you!",
                    sentAt: now - 18 * MIN,
                },
            ],
            contact: {
                followerCount: 18400,
                bio: "Model & content creator · Mumbai. Beauty, lifestyle & skincare.",
                location: "Mumbai, India",
                isTrendlyInfluencer: true,
                linkedInfluencerId: "inf_arpita_001",
            },
        },

        // --- Instagram comment on a reel, unread ---
        {
            id: "c_ig_comment_1",
            kind: "comment",
            channel: "instagram",
            unread: true,
            participant: {
                id: "u_neha",
                name: "Neha Kapoor",
                handle: "neha.glows",
                avatarUrl: "https://i.pravatar.cc/150?img=45",
            },
            preview: "Is this safe for sensitive skin? 😍",
            lastActivityAt: now - 2 * HOUR,
            post: {
                postId: "p_reel_88",
                thumbnailUrl: "https://picsum.photos/seed/glowreel/240",
                caption: "New Vitamin C serum drop ✨ #glowup",
            },
            comment: {
                text: "Is this safe for sensitive skin? 😍",
                authoredAt: now - 2 * HOUR,
                hidden: false,
                replies: [],
            },
            contact: {
                followerCount: 920,
                bio: "skincare enthusiast",
                isTrendlyInfluencer: false,
            },
        },

        // --- Facebook Messenger DM, has a business reply already, read ---
        {
            id: "c_fb_dm_1",
            kind: "dm",
            channel: "facebook",
            unread: false,
            participant: {
                id: "u_rahul",
                name: "Rahul Verma",
                handle: "Rahul Verma",
                avatarUrl: "https://i.pravatar.cc/150?img=15",
            },
            preview: "Great, I'll place the order today. Thanks!",
            lastActivityAt: now - 5 * HOUR,
            replyWindowExpiresAt: now + (DAY - 5 * HOUR),
            messages: [
                {
                    id: "fm1",
                    author: "contact",
                    text: "Do you ship to Bangalore?",
                    sentAt: now - 6 * HOUR,
                },
                {
                    id: "fm2",
                    author: "business",
                    text: "Yes we do! Delivery is 2–3 days and free over ₹999.",
                    sentAt: now - 5.5 * HOUR,
                },
                {
                    id: "fm3",
                    author: "contact",
                    text: "Great, I'll place the order today. Thanks!",
                    sentAt: now - 5 * HOUR,
                },
            ],
            contact: {
                followerCount: 340,
                location: "Bangalore, India",
                isTrendlyInfluencer: false,
            },
        },

        // --- Facebook comment, already hidden, read ---
        {
            id: "c_fb_comment_1",
            kind: "comment",
            channel: "facebook",
            unread: false,
            participant: {
                id: "u_spam",
                name: "Deals Bot",
                handle: "Deals Bot",
                avatarUrl: "https://i.pravatar.cc/150?img=68",
            },
            preview: "Check out cheap followers at bit.ly/...",
            lastActivityAt: now - 1 * DAY,
            post: {
                postId: "p_fb_21",
                thumbnailUrl: "https://picsum.photos/seed/glowfb/240",
                caption: "Behind the scenes of our latest shoot 📸",
            },
            comment: {
                text: "Check out cheap followers at bit.ly/...",
                authoredAt: now - 1 * DAY,
                hidden: true,
                replies: [],
            },
            contact: {
                isTrendlyInfluencer: false,
            },
        },

        // --- Instagram DM, EXPIRED 24h window (composer disabled), read ---
        {
            id: "c_ig_dm_expired",
            kind: "dm",
            channel: "instagram",
            unread: false,
            participant: {
                id: "u_meera",
                name: "Meera Joshi",
                handle: "meera.styles",
                avatarUrl: "https://i.pravatar.cc/150?img=24",
            },
            preview: "Loved the new launch! 🔥",
            lastActivityAt: now - 2 * DAY,
            replyWindowExpiresAt: now - 1 * DAY, // closed
            messages: [
                {
                    id: "em1",
                    author: "contact",
                    text: "Loved the new launch! 🔥",
                    sentAt: now - 2 * DAY,
                },
            ],
            contact: {
                followerCount: 5600,
                bio: "fashion + lifestyle creator",
                isTrendlyInfluencer: true,
                linkedInfluencerId: "inf_meera_002",
            },
        },

        // --- Instagram comment with an existing public reply, read ---
        {
            id: "c_ig_comment_2",
            kind: "comment",
            channel: "instagram",
            unread: false,
            participant: {
                id: "u_sana",
                name: "Sana Khan",
                handle: "sana.k",
                avatarUrl: "https://i.pravatar.cc/150?img=49",
            },
            preview: "Where can I buy this? 🛍️",
            lastActivityAt: now - 3 * DAY,
            post: {
                postId: "p_reel_70",
                thumbnailUrl: "https://picsum.photos/seed/glowserum/240",
                caption: "Our bestseller is back in stock 💧",
            },
            comment: {
                text: "Where can I buy this? 🛍️",
                authoredAt: now - 3 * DAY - 30 * MIN,
                hidden: false,
                replies: [
                    {
                        id: "cr1",
                        author: "business",
                        text: "Hi Sana! It's live on our website now — link in bio 💛",
                        sentAt: now - 3 * DAY,
                    },
                ],
            },
            contact: {
                followerCount: 2100,
                isTrendlyInfluencer: false,
            },
        },
    ];
}
