import {
  DUMMY_MANAGER_CREDENTIALS,
  DUMMY_MANAGER_CREDENTIALS2,
} from "@/constants/Manager";

export const checkTestUsers = (email: string) => {
  if (
    [
      DUMMY_MANAGER_CREDENTIALS.email,
      DUMMY_MANAGER_CREDENTIALS2.email,
    ].includes(email)
  ) {
    return true;
  }

  return false;
};
