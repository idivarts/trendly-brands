import React, { createContext, useContext, useState, ReactNode } from "react";

type CollapseContextType = {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapse: () => void;
};

const CollapseContext = createContext<CollapseContextType | undefined>(
  undefined
);

export const CollapseProvider = ({ children }: { children: ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  return (
    <CollapseContext.Provider value={{ isCollapsed, setIsCollapsed, toggleCollapse }}>
      {children}
    </CollapseContext.Provider>
  );
};

export const useCollapseContext = (): CollapseContextType => {
  const context = useContext(CollapseContext);
  if (!context) {
    // If a CollapseProvider is not present, return safe defaults so
    // components using the hook don't crash. This makes the provider
    // optional for simple usage sites where collapse functionality
    // is not required.
    return {
      isCollapsed: false,
      setIsCollapsed: () => {},
      toggleCollapse: () => {},
    } as CollapseContextType;
  }
  return context;
};