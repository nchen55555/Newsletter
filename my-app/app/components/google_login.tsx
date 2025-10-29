"use client"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useSubscriptionContext } from "./subscription_context"
import { Skeleton } from "@/components/ui/skeleton"

interface GoogleLoginProps {
    buttonText: string
    flowType: 'login' | 'subscribe'
    referral_id?: number
}

export function GoogleLogin({
    buttonText,
    flowType,
    referral_id,
}: GoogleLoginProps) {
    const supabase = createClientComponentClient()
    const [isAuthLoading, setIsAuthLoading] = useState(false)
    const { isSubscribed, loading} = useSubscriptionContext()

    const handleGoogleLogin = async () => {
        setIsAuthLoading(true)
        localStorage.setItem('googleAuthFlowType', flowType);
        // Store referral_id if provided
        if (referral_id) {
            localStorage.setItem('referral_id', referral_id.toString());
        }
        supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo:  flowType === 'subscribe' ? `${location.origin+"/access"}` : `${location.origin}`,
                // scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
                queryParams: {
                    // access_type: 'offline',
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
        className="bg-black hover:bg-black/90 text-lg px-8 py-4 h-14"
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