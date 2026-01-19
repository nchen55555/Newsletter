'use client'

import { useEffect } from 'react'
import { UserStatusCheckin } from './user-status-checkin'
import { useStatusCheckin } from './status-checkin-context'
import { useRouter, usePathname } from 'next/navigation'
import { useSubscriptionContext } from './subscription_context'
// Helper function to check if status dialog should be shown
function checkIfShouldShowStatusDialog(interviewStatusUpdatedAt: string | null): boolean {
  // If never updated, show the dialog
  if (!interviewStatusUpdatedAt) {
    return true
  }
  
  // Check if it's been 3 weeks (21 days) since last update
  const lastUpdateDate = new Date(interviewStatusUpdatedAt)
  const now = new Date()
  const threeWeeksInMs = 21 * 24 * 60 * 60 * 1000 // 21 days in milliseconds
  const timeDifference = now.getTime() - lastUpdateDate.getTime()
  
  return timeDifference >= threeWeeksInMs
}

export function LayoutDialogs() {
  const { isOpen, setIsOpen } = useStatusCheckin()
  const router = useRouter()
  const pathname = usePathname()
  const { isSubscribed } = useSubscriptionContext()

  // Load user profile and check if status dialog should be shown
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetch('/api/get_profile', { credentials: 'include' })
        if (response.ok) {
          const userData = await response.json()
          
          // Only show status dialog if user has applied, we're on a company page, AND meets timing conditions
          const onCompanyPage = pathname?.startsWith('/companies/')
          const skipOnboarding =
            typeof window !== 'undefined' &&
            window.sessionStorage.getItem('skipOnboarding') === 'true'

          if (userData.applied && onCompanyPage) {
            const shouldShowDialog = checkIfShouldShowStatusDialog(userData.interview_status_updated_at)
            if (shouldShowDialog) {
              setIsOpen(true)
            }
          }
          else if (!skipOnboarding && isSubscribed && !userData.applied) {
            router.push('/profile?flow=onboarding')
          }
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
      }
    }

    loadUserProfile()
  }, [setIsOpen, pathname, router])

  const handleStatusUpdate = () => {
    setIsOpen(false)
    
    // You could add additional logic here like showing a success message,
    // updating global state, refreshing data, etc.
  }

  return (
    <>
      <UserStatusCheckin
        open={isOpen}
        onStatusUpdate={handleStatusUpdate}
      />
    </>
  )
}