import { PropsWithChildren } from "react";

export const ChatProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <>
      {children}
    </>
  );
};
