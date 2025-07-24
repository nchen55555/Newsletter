'use client'

import { useRouter } from 'next/navigation'
import { useSubscriptionContext } from './subscription_context'
import { GoogleLogin } from './google_login'

export function Login() {
    const router = useRouter()
   
    const { refreshSubscription } = useSubscriptionContext()

    // Handle successful sign in
    const handleSignInSuccess = async () => {

        const isSubscribed = await refreshSubscription()
        // Only hide loading if we're staying on this page
        if (!isSubscribed) {
            router.push('/access')  // Keep loading while redirecting
        }
    }

    return (
        <GoogleLogin 
            buttonText="login" 
            onSignInSuccess={handleSignInSuccess}
            flowType="login"
        />
    )
}