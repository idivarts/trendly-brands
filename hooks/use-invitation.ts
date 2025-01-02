import { useEffect, useState } from "react";

interface UseInvitationProps {
  checkIfAlreadyInvited: (influencerId: string) => Promise<boolean>;
  influencerId: string | undefined;
}

const useInvitation = ({
  checkIfAlreadyInvited,
  influencerId,
}: UseInvitationProps) => {
  const [isAlreadyInvited, setIsAlreadyInvited] = useState(false);

  useEffect(() => {
    if (checkIfAlreadyInvited && influencerId) {
      checkIfAlreadyInvited(influencerId).then((invited) => {
        setIsAlreadyInvited(invited);
      });
    }
  }, []);

  return {
    isAlreadyInvited,
  };
};

export default useInvitation;
