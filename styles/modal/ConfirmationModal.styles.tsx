import Colors from "@/constants/Colors";
import { Theme } from "@react-navigation/native";
import { StyleSheet } from "react-native";

const stylesFn = (theme: Theme) => StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors(theme).backdrop,
  },
  modalView: {
    margin: 20,
    backgroundColor: Colors(theme).background,
    borderRadius: 4,
    padding: 25,
    alignItems: "center",
    shadowColor: Colors(theme).backdrop,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    backgroundColor: Colors(theme).primary,
  },
});

export default stylesFn;
