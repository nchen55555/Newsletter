'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useSubscriptionContext } from './subscription_context'
import { GoogleLogin } from './google_login'

export function Login() {
    const router = useRouter()
    // const checkSubscription = () => {
    //     return fetch('/api/subscription')
    //         .then(res => res.json())
    //         .then(data => data.isSubscribed)
    //         .catch(error => {
    //             console.error('Error checking subscription:', error)
    //             return false
    //         })
    // }
    const [loading, setLoading] = useState(false)
    const { refreshSubscription } = useSubscriptionContext()

    // Handle successful sign in
    const handleSignInSuccess = async () => {
        setLoading(true)  // Show loading immediately

        // const isSubscribed = await checkSubscription()
        const isSubscribed = await refreshSubscription()
        // Only hide loading if we're staying on this page
        if (!isSubscribed) {
            router.push('/access')  // Keep loading while redirecting
        } else {
            setLoading(false)
        }
    }

    return (
        <GoogleLogin 
            buttonText="login" 
            disabled={loading}
            onSignInSuccess={handleSignInSuccess} 
            redirectOnFail={true} 
            flowType="login" 
        />
    )
}