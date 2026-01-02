"use client"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useSubscriptionContext } from "./subscription_context"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

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
                redirectTo:  flowType === 'subscribe' ? `${location.origin+"/access"}` : `${location.origin+"/login"}`,
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
        size={flowType === 'subscribe' ? 'lg' : 'sm'}
        className={flowType === 'subscribe'
          ? "bg-white hover:bg-white/90 text-lg px-8 py-4 h-14"
          : "bg-white hover:bg-white/90 ml-auto"
        }
        >
        {(loading || isAuthLoading) ? (
            <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <link rel="alternate" href="atom.xml" type="application/atom+xml" title="Atom" />loading...
            </>
        ) : buttonText}
        </Button>)}
        </div>
    )

}