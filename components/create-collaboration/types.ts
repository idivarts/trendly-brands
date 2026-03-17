export interface AICampaignDraft {
    name?: string;
    description?: string;
    promotionType?: string;
    budget?: {
        min?: number | string;
        max?: number | string;
    };
    numberOfInfluencersNeeded?: number | string;
    platform?: string[];
    contentFormat?: string[];
    preferredContentLanguage?: string[];
    location?: {
        type?: string;
        name?: string;
        latlong?: {
            lat?: number;
            long?: number;
        };
    };
    questionsToInfluencers?: string[];
    preferences?: Record<string, unknown>;
}

export type AIGeneratedCampaignData =
    | AICampaignDraft
    | {
        collaboration?: AICampaignDraft;
    };
