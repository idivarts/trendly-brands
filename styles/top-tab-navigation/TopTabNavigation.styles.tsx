import { StyleSheet } from "react-native";
import { Theme } from "@react-navigation/native";
import Colors from "@/constants/Colors";

export const stylesFn = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors(theme).transparent,
    alignItems: 'center',
  },
  tabScroll: {
    maxHeight: 68,
    padding: 8,
    paddingTop: 0,
  },
  tabScrollContainer: {
    paddingLeft: 8,
    paddingRight: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: theme?.dark ? Colors(theme).card : Colors(theme).aliceBlue,
    position: 'relative',
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 16,
    color: Colors(theme).primary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors(theme).white,
  },
  compactTabScroll: {
    maxHeight: 62,
  },
  compactTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  compactText: {
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
    width: '100%',
  },
});
