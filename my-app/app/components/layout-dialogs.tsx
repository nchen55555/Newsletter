'use client'

import { useEffect, useState } from 'react'
import { UserStatusCheckin } from './user-status-checkin'
import { useStatusCheckin } from './status-checkin-context'

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
  const [currentUser, setCurrentUser] = useState<{ first_name?: string } | null>(null)

  // Load user profile and check if status dialog should be shown
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetch('/api/get_profile', { credentials: 'include' })
        if (response.ok) {
          const userData = await response.json()
          setCurrentUser(userData)
          
          // Only show status dialog if user has applied AND meets timing conditions
          if (userData.applied) {
            const shouldShowDialog = checkIfShouldShowStatusDialog(userData.interview_status_updated_at)
            if (shouldShowDialog) {
              setIsOpen(true)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
      }
    }

    loadUserProfile()
  }, [setIsOpen])

  const handleStatusUpdate = (status: string, timeline?: string, outreachFrequency?: number) => {
    console.log('User status updated:', { status, timeline, outreachFrequency })
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