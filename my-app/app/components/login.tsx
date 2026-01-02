'use client'

import { useSubscriptionContext } from './subscription_context'
import { GoogleLogin } from './google_login'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function Login() {
    const { isSubscribed, loading } = useSubscriptionContext()
    const supabase = createClientComponentClient()
    const router = useRouter()

    const handleLogout = async () => {
      const { error } = await supabase.auth.signOut()
      if (error) console.error('Logout error:', error)
      else router.push('/')
    }
    
    if (loading) {
        return <Skeleton className="h-12 w-full" />; // or customize size
    }

    if (isSubscribed) {
      return (
        <Button
        onClick={handleLogout}
        disabled={loading}
        variant="default"
        size="sm"
        className="bg-black hover:bg-black/90 text-white ml-auto"
        >
        {(loading) ? (
            <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <link rel="alternate" href="atom.xml" type="application/atom+xml" title="Atom" />loading...
            </>
        ) : "logout"}
        </Button>

      );
    }
    else{
      return (
        <GoogleLogin buttonText="login" flowType="login" />
      );
    }
}