'use client'
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type SubscriptionContextType = {
  isSubscribed: boolean;
  setIsSubscribed: (val: boolean) => void;
  refreshSubscription: () => Promise<boolean>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const supabase = createClientComponentClient()

  const refreshSubscription = useCallback(async () => {
    const res = await fetch("/api/subscription");
    const data = await res.json();
    setIsSubscribed(data.isSubscribed);
    return data.isSubscribed;
  }, []);

  // Optionally: fetch on mount
  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') {
        setIsSubscribed(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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