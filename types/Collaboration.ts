import {
  IApplications,
  ICollaboration,
  IInvitations,
} from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { Brand } from "./Brand";
import { User } from "./User";

export interface Collaboration extends ICollaboration {
  id: string;
}

export interface Application extends IApplications {
  id: string;
}

export interface Invitation extends IInvitations {
  id: string;
}

export type InfluencerApplication = {
  id: string,
  application: Application;
  influencer: User;
  collaboration?: Partial<Collaboration>;
  brand?: Partial<Brand>;
};
