import {
  IGroups,
  IMessages,
} from "@/shared-libs/firestore/trendly-pro/models/groups";

export interface Groups extends IGroups {
  id: string;
  collaboration?: any;
  image: string;
  users: any[];
  managers: any[];
  isUnreadMessages: boolean;
}
