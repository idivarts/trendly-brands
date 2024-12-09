import { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";

export const DUMMY_INFLUENCER: IUsers = {
  name: "John Doe",
  profileImage:
    "https://www.pngkey.com/png/full/114-1149878_setting-user-avatar-in-specific-size-without-breaking.png",
  email: "johndoe@gmail.com",
  phoneNumber: "1234567890",
  location: "New York",
  emailVerified: true,
  phoneVerified: true,
  profile: {
    introVideo: "",
    content: {
      about: "I am a social media influencer",
      socialMediaHighlight: "I have 100k followers on Instagram",
      collaborationGoals: "I want to collaborate with brands",
      audienceInsights: "My audience is mostly from the US",
      funFactAboutUser: "I love to travel",
    },
    category: ["Fashion", "Lifestyle"],
    attachments: [
      {
        type: "image",
        imageUrl:
          "https://www.pngkey.com/png/full/114-1149878_setting-user-avatar-in-specific-size-without-breaking.png",
      },
    ],
  },
  preferences: {
    question1: ["Option1"],
    question2: ["Option2"],
    question3: ["Option3"],
    question4: ["Option4"],
  },
  settings: {
    theme: "light",
    emailNotification: true,
    pushNotification: true,
  },
  backend: {
    followers: 100000,
    reach: 1000000,
    engagement: 10,
    rating: 4.5,
  },
  pushNotificationToken: {
    ios: [],
    android: [],
    web: [],
  },
  //@ts-ignore
  notifications: [],
  //@ts-ignore
  socials: [],
};
