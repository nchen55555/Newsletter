'use client'
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { ExtendedSession } from "@/app/types";

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
    try {
      const res = await fetch("/api/check-subscription");
      const data = await res.json();
      console.log("Subscription API response:", data);
      setIsSubscribed(data.isSubscribed);
      return data.isSubscribed;
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      return false;
    }
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
        console.log('SIGNED_IN event triggered, session:', session);
        
        // Try to get Google's refresh token from provider_refresh_token
        const googleRefreshToken = (session as ExtendedSession)?.provider_refresh_token;
        console.log('Google refresh token found:', !!googleRefreshToken);
        
        if (googleRefreshToken) {
          console.log('Making request to store Google refresh token...');
          fetch('/api/oauth/google/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ provider_refresh_token: googleRefreshToken }),
          }).then(async response => {
            console.log('Store Google refresh token response:', response.status);
            const data = await response.json();
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
            }
            return data;
          }).then(data => {
            console.log('Store Google refresh token result:', data);
          }).catch(error => {
            console.error('Failed to store Google refresh token:', error);
            // Don't block the rest of the flow if token storage fails
          })
        } else {
          console.log('No Google refresh token found in session - checking if user needs to re-authenticate');
          console.log('Available session keys:', Object.keys(session || {}));
          console.log('Provider token available:', !!(session as ExtendedSession)?.provider_token);
          
          // If no Google refresh token, the user may need to re-authenticate with proper scopes
          console.warn('Google refresh token not available. User may need to re-authenticate with offline access.');
        }
        setUserEmail(session.user.email); // replaces onEmailChange
        refreshSubscription().then((isSubscribedNow) => {
          setIsSubscribed(isSubscribedNow);
          const flowType = localStorage.getItem('googleAuthFlowType');
          if (flowType === 'subscribe') {
            setShowSubscribeDialog(true); // replaces onSignInSuccess for subscribe
          } else if (flowType === 'calendar_auth') {
            // Calendar authentication completed - redirect back to the original page
            console.log('Calendar authentication completed');
            const returnUrl = localStorage.getItem('calendarAuthReturnUrl');
            if (returnUrl) {
              localStorage.removeItem('calendarAuthReturnUrl');
              window.location.href = returnUrl;
            }
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