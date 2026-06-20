import { ContentStrategy } from "./types";

export const CHATBOT_QUESTIONS = [
    "What are your initial thoughts on your brand? What would you like to start with — product demos, founder stories, or something else?",
    "How long do you want to create a strategy for — a week, a full month, or maybe 6 months?",
    "What kind of posts are you thinking of — influencer content, regular feed posts, Reels, or a mix? Tell us in detail.",
    "Tell us more about your brand. What are your key goals, and what would you consider a success at the end of this strategy?",
];

export const MOCK_STRATEGY_CONTENT = `# 30-Day Content Strategy: Your Brand

## Executive Summary
A 30-day influencer-driven content plan focused on authentic brand storytelling, micro-creator partnerships, and community engagement across Instagram.

## Goals & KPIs
- **Reach:** 50,000+ impressions over 30 days
- **Engagement Rate:** ≥ 4%
- **Influencer Applications:** 20+ per collaboration
- **Follower Growth:** +500 net new followers

## Content Mix

| Type | Share |
|------|-------|
| Influencer Collabs | 40% |
| Educational Posts | 30% |
| Product Showcases | 20% |
| Behind-the-Scenes | 10% |

## Week-by-Week Breakdown

### Week 1 — Foundation
**Theme:** Introduce your brand story
- **Mon:** Founder story Reel (partnered micro-influencer)
- **Wed:** Product showcase carousel with key benefits
- **Fri:** Behind-the-scenes Story series

### Week 2 — Engagement
**Theme:** Build community trust
- **Mon:** User-generated content repost + CTA
- **Wed:** Tutorial / how-to post with micro-influencer collab
- **Fri:** Interactive poll + Q&A Stories

### Week 3 — Authority
**Theme:** Establish credibility
- **Mon:** Deep-dive post on brand mission
- **Wed:** Collab with 2 niche micro-influencers (10k–50k)
- **Fri:** Customer testimonial carousel

### Week 4 — Conversion
**Theme:** Drive action
- **Mon:** Limited-time offer post with influencer code
- **Wed:** Campaign wrap-up Reel
- **Fri:** Community shout-out + metrics recap

## Budget Allocation
- Micro-influencer fees: ₹80,000
- Content creation support: ₹20,000
- Post boosting: ₹10,000
- **Total: ₹1,10,000**

## Next Steps
1. Shortlist 5 micro-influencers via Trendly Discover
2. Post first collaboration within 7 days
3. Review analytics after Week 1 and adjust content mix
`;

export const MOCK_STRATEGIES: ContentStrategy[] = [
    {
        id: "mock-1",
        title: "Q1 Growth Campaign",
        content: MOCK_STRATEGY_CONTENT,
        createdAt: "15 Apr 2026",
        chatMessages: [],
    },
    {
        id: "mock-2",
        title: "Summer Launch 2026",
        content: MOCK_STRATEGY_CONTENT,
        createdAt: "22 Mar 2026",
        chatMessages: [],
    },
];
