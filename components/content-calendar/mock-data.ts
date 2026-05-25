import { CalendarItem } from "./types";

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth(); // 0-indexed

function iso(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export const MOCK_CALENDAR_ITEMS: CalendarItem[] = [
    {
        id: "item-1",
        title: "Founder Story Launch Reel",
        idea: "A 30-second reel where the founder shares the 'why' behind the brand — raw, personal, authentic.",
        date: iso(y, m, 3),
        type: "reel",
    },
    {
        id: "item-2",
        title: "Product Benefits Carousel",
        idea: "5-slide carousel breaking down the top 5 benefits of our hero product with bold visuals.",
        date: iso(y, m, 7),
        type: "carousel",
    },
    {
        id: "item-3",
        title: "Behind-the-Scenes Story",
        idea: "A Story series showing how the product is made — packaging, quality checks, team vibes.",
        date: iso(y, m, 10),
        type: "story",
    },
    {
        id: "item-4",
        title: "Micro-Influencer Collab Post",
        idea: "Feature a micro-influencer using our product in their daily routine. Authentic + aspirational.",
        date: iso(y, m, 14),
        type: "post",
    },
    {
        id: "item-5",
        title: "Q&A Live Session",
        idea: "Founder goes live to answer questions about the brand, product, and upcoming launches.",
        date: iso(y, m, 17),
        type: "live",
    },
    {
        id: "item-6",
        title: "Customer Testimonial Reel",
        idea: "Short reel stitching together 3 real customer reviews — faces, quotes, and results.",
        date: iso(y, m, 21),
        type: "reel",
    },
    {
        id: "item-7",
        title: "Limited-Time Offer Post",
        idea: "Announcement post for a 48-hour flash sale. Influencer discount code featured prominently.",
        date: iso(y, m, 24),
        type: "post",
    },
];
