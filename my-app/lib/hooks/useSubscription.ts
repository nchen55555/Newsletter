import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useSubscription() {
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Check subscription status and return result immediately
  const checkSubscription = async () => {
    try {
      setLoading(true)
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session?.user?.email) return false
      
      // Just check if email exists in subscribers table
      const { count, error: subError } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('email', session.user.email)
      
      if (subError) throw subError
      
      // If we have any rows, user is subscribed
      setIsSubscribed(count !== null && count > 0)
    } catch (error) {
      console.error('Error checking subscription:', error)
      setEmail(null)
      setIsSubscribed(false)
    } finally {
      setLoading(false)
    }
    return isSubscribed
  }

  // Initial check on mount
  useEffect(() => {
    checkSubscription()
  }, [])

  return { email, isSubscribed, loading, checkSubscription }
}
