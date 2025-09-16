import React, { createContext, useContext, useState, useEffect } from "react";

interface NetworkVisibilityContextType {
  showNetworkInfo: boolean;
  toggleNetworkVisibility: () => void;
}

const NetworkVisibilityContext = createContext<
  NetworkVisibilityContextType | undefined
>(undefined);

export function NetworkVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showNetworkInfo, setShowNetworkInfo] = useState(true);

  // Load saved preference on mount
  useEffect(() => {
    const savedVisibility = localStorage.getItem("networkVisibility");
    if (savedVisibility !== null) {
      setShowNetworkInfo(savedVisibility === "true");
    }
  }, []);

  // Save preference when it changes
  useEffect(() => {
    localStorage.setItem("networkVisibility", String(showNetworkInfo));
  }, [showNetworkInfo]);

  const toggleNetworkVisibility = () => {
    setShowNetworkInfo((prev) => !prev);
  };

  return (
    <NetworkVisibilityContext.Provider
      value={{ showNetworkInfo, toggleNetworkVisibility }}
    >
      {children}
    </NetworkVisibilityContext.Provider>
  );
}

export function useNetworkVisibility() {
  const context = useContext(NetworkVisibilityContext);
  if (context === undefined) {
    throw new Error(
      "useNetworkVisibility must be used within a NetworkVisibilityProvider",
    );
  }
  return context;
}
