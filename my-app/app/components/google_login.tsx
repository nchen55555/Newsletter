"use client"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSubscriptionContext } from "./subscription_context"

interface GoogleLoginProps {
    buttonText: string
    onSignInSuccess: (isSubscribed: boolean) => void
    onEmailChange?: (email: string) => void
    flowType: 'login' | 'subscribe'
}

export function GoogleLogin({
    buttonText,
    onSignInSuccess,
    onEmailChange,
    flowType,
}: GoogleLoginProps) {
    const supabase = createClientComponentClient()
    const [isAuthLoading, setIsAuthLoading] = useState(false)
    const { refreshSubscription } = useSubscriptionContext()

    // Set up auth listener
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session?.user?.email) {
            const flow = localStorage.getItem('googleAuthFlow');
            if (flow === flowType) {
                onEmailChange?.(session.user.email);
                (async () => {
                    const isSubscribed = await refreshSubscription();
                    onSignInSuccess(isSubscribed);
                    localStorage.removeItem('googleAuthFlow');
                    setIsAuthLoading(false);
                })();
            } else {
                setIsAuthLoading(false);
            }
          }
        })
    
        return () => {
          subscription.unsubscribe()
        }
    }, [onEmailChange, refreshSubscription, onSignInSuccess, supabase.auth, flowType])

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
            disabled={isAuthLoading}
            variant="default"
            size="lg"
            className="bg-black hover:bg-black/90"
        >
            {!isAuthLoading && buttonText}
        </Button>
    )

}