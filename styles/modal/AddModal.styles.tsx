import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const stylesFn = (theme: Theme) => StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: Colors(theme).transparent,
    gap: 12,
  },
  modalContent: {
    minHeight: 240,
    gap: 20,
    backgroundColor: Colors(theme).aliceBlue,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    padding: 10,
  },
  modalTitleContainer: {
    backgroundColor: Colors(theme).transparent,
    position: "relative",
  },
  modalTitle: {
    paddingTop: 15,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    right: 0,
    top: 0,
  },
  modalInputContainer: {
    gap: 10,
    backgroundColor: Colors(theme).transparent,
  }
});

export default stylesFn;
