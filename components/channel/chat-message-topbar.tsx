import FirstPhase from "./message-topbar/first-phase";
import FourthPhase from "./message-topbar/fourth-phase";
import SecondPhase from "./message-topbar/second-phase";
import ThirdPhase from "./message-topbar/third-phase";
import { Contract } from "@/types/Contract";
import { useState } from "react";

interface ChatMessageTopbarProps {
  contract: Contract;
}

const ChatMessageTopbar: React.FC<ChatMessageTopbarProps> = ({
  contract,
}) => {
  const [status, setStatus] = useState(contract.status || 0);

  if (status === 0) {
    return (
      <FirstPhase
        contract={contract}
        contractId={contract.id}
        setStatus={setStatus}
      />
    );
  } else if (status === 1) {
    return <SecondPhase setStatus={setStatus} />;
  } else if (status === 2) {
    return (
      <ThirdPhase
        contract={contract}
        contractId={contract.id}
        setStatus={setStatus}
      />
    );
  } else if (status === 3) {
    return <FourthPhase />;
  } else {
    return null;
  }
}

export default ChatMessageTopbar;
