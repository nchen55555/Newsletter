'use client'
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

type SubscriptionContextType = {
  isSubscribed: boolean;
  setIsSubscribed: (val: boolean) => void;
  refreshSubscription: () => Promise<boolean>;
  userEmail: string | null;
  showSubscribeDialog: boolean;
  setShowSubscribeDialog: (val: boolean) => void;
  loading: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);

  const refreshSubscription = useCallback(async () => {
    const res = await fetch("/api/subscription");
    const data = await res.json();
    setIsSubscribed(data.isSubscribed);
    return data.isSubscribed;
  }, []);

  useEffect(() => {
    // Validate session and user existence
    const validateAuth = async () => {
      try {
        // First get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          setIsSubscribed(false);
          setLoading(false);
          return;
        }

        // Then validate the user actually exists in Supabase Auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          // User doesn't exist anymore, clear session and set not subscribed
          await supabase.auth.signOut();
          setIsSubscribed(false);
          setLoading(false);
          return;
        }

        // User exists, now check subscription status via API
        refreshSubscription().then((isSubscribedNow) => {
          setIsSubscribed(isSubscribedNow);
          setLoading(false);
        });
        
      } catch (error) {
        console.error('Auth validation error:', error);
        setIsSubscribed(false);
        setLoading(false);
      }
    };

    validateAuth();
  }, [supabase.auth, refreshSubscription]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        setUserEmail(session.user.email); // replaces onEmailChange
        refreshSubscription().then((isSubscribedNow) => {
          setIsSubscribed(isSubscribedNow);
          const flowType = localStorage.getItem('googleAuthFlowType');
          if (flowType === 'subscribe') {
            setShowSubscribeDialog(true); // replaces onSignInSuccess for subscribe
          }
          localStorage.removeItem('googleAuthFlowType');
        });
      }
      if (event === 'SIGNED_OUT') {
        setIsSubscribed(false);
        setUserEmail(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [router, refreshSubscription, supabase.auth]);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed,
      setIsSubscribed,
      refreshSubscription,
      userEmail,
      showSubscribeDialog,
      setShowSubscribeDialog, loading }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscriptionContext must be used within a SubscriptionProvider");
  return ctx;
}