"use client"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSubscriptionContext } from "./subscription_context"

interface GoogleLoginProps {
    buttonText: string
    disabled?: boolean
    onSignInSuccess: (isSubscribed: boolean) => void
    onEmailChange?: (email: string) => void
    redirectOnFail?: boolean
    flowType: 'login' | 'subscribe'
}

export function GoogleLogin({
    buttonText,
    disabled,
    onSignInSuccess,
    onEmailChange,
    redirectOnFail = false,
    flowType
}: GoogleLoginProps) {
    const supabase = createClientComponentClient()
    const [isAuthLoading, setIsAuthLoading] = useState(false)
    const { refreshSubscription } = useSubscriptionContext()

    // Set up auth listener
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session?.user?.email) {
            onEmailChange?.(session.user.email)
            const flow = localStorage.getItem('googleAuthFlow')
            if (flow === flowType) {
                (async () => {
                    const isSubscribed = await refreshSubscription();
                    // Now use the global isSubscribed value
                    onSignInSuccess(isSubscribed);
                    localStorage.removeItem('googleAuthFlow');
                    setIsAuthLoading(false);
                  })();
                }
                
              // Check subscription status via API
            //   fetch('/api/subscription')
            //     .then(res => res.json())
            //     .then(data => {
            //       onSignInSuccess(data.isSubscribed)
            //       localStorage.removeItem('googleAuthFlow')
            //     })
            //     .catch(error => {
            //       console.error('Error checking subscription:', error)
            //       onSignInSuccess(false)
            //     })
            //     .finally(() => {
            //       setIsAuthLoading(false)
            //     })
            else {
              setIsAuthLoading(false)
            }
          }
        })
    
        return () => {
          subscription.unsubscribe()
        }
    }, [onEmailChange, refreshSubscription, flowType])

    const handleGoogleLogin = async () => {
        setIsAuthLoading(true)
        localStorage.setItem('googleAuthFlow', flowType)
        
        supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${location.origin}`,
                queryParams: {
                    prompt: 'consent',
                },
            },
        }).catch(error => {
                console.error('Login error:', error)
                setIsAuthLoading(false)
            })
      }
    
    return (
        <Button
            onClick={handleGoogleLogin}
            disabled={isAuthLoading || disabled}
            variant="default"
            size="lg"
            className="bg-black hover:bg-black/90"
        >
            {!isAuthLoading && buttonText}
        </Button>
    )

}