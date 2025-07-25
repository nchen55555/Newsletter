'use client'

import { useSubscriptionContext } from './subscription_context'
import { GoogleLogin } from './google_login'
import { Skeleton } from '@/components/ui/skeleton'

export function Login() {
    const { isSubscribed, loading } = useSubscriptionContext()
    
    if (loading) {
        return <Skeleton className="h-12 w-full" />; // or customize size
      }
    

      return (
        !isSubscribed && (
          <GoogleLogin buttonText="login" flowType="login" />
        )
      );
}