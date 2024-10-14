import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";

export interface Manager extends IManagers {
  id: string;
  preferences?: {
    question1?: string;
    question2?: string;
    question3?: string;
  };
  profileImage?: string;
  settings?: {
    theme?: "light" | "dark";
    emailNotification?: boolean;
    pushNotification?: boolean;
  };
  pushNotificationToken: {
    ios?: string[];
    android?: string[];
    web?: string[];
  };
}
