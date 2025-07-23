'use client'
import React, { createContext, useContext, useState, useCallback } from "react";

type SubscriptionContextType = {
  isSubscribed: boolean;
  setIsSubscribed: (val: boolean) => void;
  refreshSubscription: () => Promise<boolean>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const refreshSubscription = useCallback(async () => {
    const res = await fetch("/api/subscription");
    const data = await res.json();
    setIsSubscribed(data.isSubscribed);
    return data.isSubscribed;
  }, []);

  // Optionally: fetch on mount
  React.useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, setIsSubscribed, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscriptionContext must be used within a SubscriptionProvider");
  return ctx;
}