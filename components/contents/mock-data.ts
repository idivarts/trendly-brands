import { ContentItem } from "./types";

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();

function iso(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export const MOCK_CONTENT_ITEMS: ContentItem[] = [
    {
        id: "content-1",
        platforms: ["instagram", "facebook"],
        title: "Founder Story Launch Reel",
        idea: "A 30-second reel where the founder shares the 'why' behind the brand — raw, personal, authentic.",
        date: iso(y, m, 3),
        type: "reel",
        status: "approved",
        caption: "From day one, this brand was built for YOU. 🙌 Swipe up to see how it all started. #FounderStory #BehindTheBrand",
        hashtags: "#FounderStory #BehindTheBrand #Authentic #D2C #IndianBrand",
        timeOfPosting: "19:30",
        script: "Hey everyone! I started this brand because I couldn't find a product that truly worked for me...\n\n[Cut to product shots]\n\nThis isn't just a business — it's personal.\n\n[Founder to camera, sincere close]\n\nAnd I built it for YOU. Link in bio to learn more.",
        isArchived: false,
        createdAt: iso(y, m, 1),
    },
    {
        id: "content-2",
        platforms: ["instagram", "linkedin"],
        title: "Product Benefits Carousel",
        idea: "5-slide carousel breaking down the top 5 benefits of our hero product with bold visuals.",
        date: iso(y, m, 7),
        type: "carousel",
        status: "review_pending",
        caption: "5 reasons why our hero product is a game-changer 👉",
        hashtags: "#ProductLaunch #Benefits #Skincare #D2C",
        timeOfPosting: "12:00",
        imagePrompt: "Bold, minimal design. Each slide features a single benefit with icon on a clean white background. Brand colors: deep blue and white.",
        isArchived: false,
        createdAt: iso(y, m, 5),
    },
    {
        id: "content-3",
        platforms: ["instagram", "facebook"],
        title: "Behind-the-Scenes Story",
        idea: "A Story series showing how the product is made — packaging, quality checks, team vibes.",
        date: iso(y, m, 10),
        type: "story",
        status: "draft",
        isArchived: false,
        createdAt: iso(y, m, 8),
    },
    {
        id: "content-4",
        platforms: ["instagram", "facebook"],
        title: "Micro-Influencer Collab Post",
        idea: "Feature a micro-influencer using our product in their daily routine. Authentic + aspirational.",
        date: iso(y, m, 14),
        type: "post",
        status: "draft",
        isArchived: false,
        createdAt: iso(y, m, 10),
    },
    {
        id: "content-5",
        platforms: ["instagram", "facebook"],
        title: "Q&A Live Session",
        idea: "Founder goes live to answer questions about the brand, product, and upcoming launches.",
        date: iso(y, m - 1, 17),
        type: "live",
        status: "approved",
        caption: "Going LIVE tonight at 7PM! Come ask me anything. 🎙️",
        hashtags: "#LiveQnA #AskMeAnything #BrandStory",
        timeOfPosting: "19:00",
        isArchived: true,
        createdAt: iso(y, m - 1, 14),
    },
    {
        id: "content-6",
        platforms: ["instagram"],
        title: "Customer Testimonial Reel",
        idea: "Short reel stitching together 3 real customer reviews — faces, quotes, and results.",
        date: iso(y, m - 1, 21),
        type: "reel",
        status: "approved",
        caption: "Don't take our word for it — hear it from them 💬",
        hashtags: "#CustomerLove #Testimonials #RealResults",
        timeOfPosting: "21:00",
        script: "[Customer 1 - speaking to camera]\n'I never expected results this fast...'\n\n[Customer 2 - holding product]\n'This is honestly the best thing I've bought this year.'\n\n[Customer 3 - smiling]\n'I recommended it to my whole family!'\n\n[Product close-up + brand outro]",
        isArchived: true,
        createdAt: iso(y, m - 1, 18),
    },
];
