"use client"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSubscriptionContext } from "./subscription_context"
import { Skeleton } from "@/components/ui/skeleton"

interface GoogleLoginProps {
    buttonText: string
    onSignInSuccess: (isSubscribedNow: boolean) => void
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
    const { isSubscribed, refreshSubscription, loading} = useSubscriptionContext()

    // Set up auth listener
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session?.user?.email) {
            const flow = localStorage.getItem('googleAuthFlow');
            if (flow === flowType) {
                onEmailChange?.(session.user.email);
                (async () => {
                    const isSubscribedNow = await refreshSubscription();
                    onSignInSuccess(isSubscribedNow);
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

    if (loading) {
    return <Skeleton className="h-12 w-full" />; // or customize size
    }

    
    return (
    <div>
    {!isSubscribed && (<Button
        onClick={handleGoogleLogin}
        disabled={isAuthLoading || loading}
        variant="default"
        size="lg"
        className="bg-black hover:bg-black/90"
        >
        {(loading || isAuthLoading) ? (
            <>
            <svg
                className="mr-2 h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
            >
                <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                />
                <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
            </svg>
            loading...
            </>
        ) : buttonText}
        </Button>)}
        </div>   
    )

}