import { Pressable } from "react-native";
import { useTheme } from "@react-navigation/native";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";

import { CHAT_MESSAGE_TOPBAR_DESCRIPTION } from "@/constants/ChatMessageTopbar";
import Colors from "@/constants/Colors";
import MessageTopbar from "@/shared-uis/components/chat-message-bar";

interface SecondPhaseProps {
  setStatus: React.Dispatch<React.SetStateAction<number>>;
}

const SecondPhase: React.FC<SecondPhaseProps> = ({
  setStatus,
}) => {
  const theme = useTheme();

  return (
    <MessageTopbar
      description={CHAT_MESSAGE_TOPBAR_DESCRIPTION.second}
      rightAction={
        <Pressable
          onPress={() => setStatus(-1)}
        >
          <FontAwesomeIcon
            icon={faClose}
            color={Colors(theme).primary}
            size={16}
          />
        </Pressable>
      }
    />
  );
}

export default SecondPhase;
