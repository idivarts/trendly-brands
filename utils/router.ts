import { router } from "expo-router";
import { ExpoRouter } from "expo-router/types/expo-router";

export const resetAndNavigate = (newPath: ExpoRouter.Href) => {
  if (router.canGoBack()) {
    router.dismissAll();
  }

  router.replace(newPath);
};
