import { TextInput } from "react-native-paper";
import AddModal from "./add-modal";

interface AddGroupProps {
  setVisible: (visible: boolean) => void;
  visible: boolean;
}

const AddGroup: React.FC<AddGroupProps> = ({
  setVisible,
  visible,
}) => {
  return (
    <AddModal
      action={() => { }}
      actionLabel="Add"
      title="Add Group"
      content={
        <>
          <TextInput
            label="Group name"
            mode="flat"
          />
          <TextInput
            label="User id"
            mode="flat"
          />
        </>
      }
      visible={visible}
      setVisible={setVisible}
    />
  );
};

export default AddGroup;
