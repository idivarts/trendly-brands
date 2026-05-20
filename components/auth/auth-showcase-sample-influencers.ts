import type { InfluencerItem } from "@/shared-uis/components/discover/discover-types";

/** First N items feed the upward column; the rest feed the downward column in `AuthPageLayout`. */
export const AUTH_SHOWCASE_MARQUEE_SPLIT_INDEX = 3;

export const authShowcaseSampleInfluencers: InfluencerItem[] = [
    {
        id: "influencer-1",
        name: "Mia Alvarez",
        username: "miaalvarez",
        profile_pic:
            "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=240&h=240",
        follower_count: 125000,
        engagement_count: 8200,
        views_count: 242000,
        engagement_rate: 4.3,
        location: "Los Angeles, CA",
        isDiscover: true,
    },
    {
        id: "influencer-2",
        name: "Kai Morgan",
        username: "kaimorgan",
        profile_pic:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=240&h=240",
        follower_count: 98000,
        engagement_count: 6400,
        views_count: 198000,
        engagement_rate: 3.9,
        location: "Austin, TX",
        isDiscover: true,
    },
    {
        id: "influencer-3",
        name: "Sana Patel",
        username: "sanapatel",
        profile_pic:
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=240&h=240",
        follower_count: 210000,
        engagement_count: 11900,
        views_count: 312000,
        engagement_rate: 5.1,
        location: "New York, NY",
        isDiscover: true,
    },
    {
        id: "influencer-4",
        name: "Noah Park",
        username: "noahpark",
        profile_pic:
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=facearea&w=240&h=240",
        follower_count: 76000,
        engagement_count: 5200,
        views_count: 141000,
        engagement_rate: 3.6,
        location: "Seattle, WA",
        isDiscover: true,
    },
    {
        id: "influencer-5",
        name: "Elena Rossi",
        username: "elenarossi",
        profile_pic:
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=240&h=240",
        follower_count: 188000,
        engagement_count: 10400,
        views_count: 276000,
        engagement_rate: 4.7,
        location: "Miami, FL",
        isDiscover: true,
    },
    {
        id: "influencer-6",
        name: "Owen Lee",
        username: "owenlee",
        profile_pic:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=240&h=240",
        follower_count: 142000,
        engagement_count: 7600,
        views_count: 224000,
        engagement_rate: 4.0,
        location: "Chicago, IL",
        isDiscover: true,
    },
];
