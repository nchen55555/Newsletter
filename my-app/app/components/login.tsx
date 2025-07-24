'use client'

import { useRouter } from 'next/navigation'
import { useSubscriptionContext } from './subscription_context'
import { GoogleLogin } from './google_login'
import { Skeleton } from '@/components/ui/skeleton'

export function Login() {
    const router = useRouter()
   
    const { refreshSubscription, loading, isSubscribed } = useSubscriptionContext()

    // Handle successful sign in
    const handleSignInSuccess = async () => {

        await refreshSubscription()
        // Only hide loading if we're staying on this page
        if (!isSubscribed) {
            router.push('/access')  // Keep loading while redirecting
        }
        router.push('/articles')
    }
    
    if (loading) {
        return <Skeleton className="h-12 w-full" />; // or customize size
      }
    
    if (isSubscribed){
        return null
    }

    return (
        <GoogleLogin 
            buttonText="login" 
            onSignInSuccess={handleSignInSuccess}
            flowType="login"
        />
    )
}