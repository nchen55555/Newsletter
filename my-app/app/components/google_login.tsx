"use client"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useSubscriptionContext } from "./subscription_context"
import { Skeleton } from "@/components/ui/skeleton"

interface GoogleLoginProps {
    buttonText: string
    flowType: 'login' | 'subscribe'
}

export function GoogleLogin({
    buttonText,
    flowType,
}: GoogleLoginProps) {
    const supabase = createClientComponentClient()
    const [isAuthLoading, setIsAuthLoading] = useState(false)
    const { isSubscribed, loading} = useSubscriptionContext()

    // Set up auth listener
    // useEffect(() => {
    //     console.log("GoogleLogin useEffect for flowType:", flowType);
    //     const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    //         console.log("Auth state changed:", event, session);
    //         const storedType = localStorage.getItem('googleAuthFlowType');
    //         if (event === 'SIGNED_IN' && session?.user?.email) {
    //         // const flow = localStorage.getItem('googleAuthFlow');
    //         // console.log("Flow from localStorage:", flow, "Expected flowType:", flowType);
    //         // if (flow === flowType && storedKey === flowType) {
    //             console.log("Outside ", storedType, flowType)
    //             if (storedType === 'login' || storedType === 'subscribe') {
    //                 onEmailChange?.(session.user.email);
    //                 (async () => {
    //                     const isSubscribedNow = await refreshSubscription();
    //                     console.log("Calling onSignInSuccess...");
    //                     onSignInSuccess(isSubscribedNow);
    //                     localStorage.removeItem('googleAuthFlowType');
    //                     setIsAuthLoading(false);
    //                 })();
    //         } else {
    //             setIsAuthLoading(false);
    //         }
    //       }
    //     })
    
    //     return () => {
    //       subscription.unsubscribe()
    //     }
    // }, [onEmailChange, refreshSubscription, onSignInSuccess, supabase.auth, flowType])

    const handleGoogleLogin = async () => {
        setIsAuthLoading(true)
        localStorage.setItem('googleAuthFlowType', flowType);
        // localStorage.setItem('googleAuthFlow', flowType)
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