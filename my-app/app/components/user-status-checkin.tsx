'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, MessageCircle, UserPlus, Target, Search} from 'lucide-react'

type UserStatus = 'perusing' | 'open_to_outreach' | 'request_intros' | 'recommend_opportunities' | 'actively_searching'

interface UserStatusCheckinProps {
  open: boolean
  onStatusUpdate: (status: UserStatus, timeline?: string, outreachFrequency?: number) => void
}

const statusOptions = [
  {
    value: 'perusing' as UserStatus,
    title: 'Just Perusing',
    icon: Eye
  },
  {
    value: 'open_to_outreach' as UserStatus,
    title: 'Will Hop on Calls If Outreached To',
    icon: MessageCircle
  },
  {
    value: 'request_intros' as UserStatus,
    title: 'Receptive to Intros but Not Planning on Requesting Any',
    icon: UserPlus
  },
  {
    value: 'recommend_opportunities' as UserStatus,
    title: 'Will Request Intros',
    icon: Target
  },
  {
    value: 'actively_searching' as UserStatus,
    title: 'Actively Searching for New Opportunities',
    icon: Search
  }
]

// Generate timeline options based on current date
const getTimelineOptions = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Helper to get month name
  const getMonthName = (monthIndex: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  };
  
  // Calculate future months
  const oneMonthOut = new Date(currentYear, currentMonth + 1);
  const threeMonthsOut = new Date(currentYear, currentMonth + 3);
  const sixMonthsOut = new Date(currentYear, currentMonth + 6);
  const twelveMonthsOut = new Date(currentYear, currentMonth + 12);
  
  return [
    { 
      value: 'immediate', 
      title: `${getMonthName(currentMonth)}/${getMonthName(oneMonthOut.getMonth())} (<1 month)`,
      description: 'Ready to hop on an intro call and interview now' 
    },
    { 
      value: 'short_term', 
      title: `~${getMonthName(threeMonthsOut.getMonth())} (3-4 months)`,
      description: 'Ready to hop on an intro call but interview in about a month' 
    },
    { 
      value: 'medium_term', 
      title: `~${getMonthName(sixMonthsOut.getMonth())} (3-6 months)`,
      description: 'Ready to hope on an intro call but actually interview in about 3-6 months' 
    },
    { 
      value: 'long_term', 
      title: `~${getMonthName(twelveMonthsOut.getMonth())} (6-12 months)`,
      description: 'Ready to hop on an intro call but maybe hold off on an actual interview' 
    },
    { 
      value: 'flexible', 
      title: 'No Specific Timeline',
      description: 'No timeline' 
    }
  ];
};

const timelineOptions = getTimelineOptions();

const outreachFrequencyOptions = [
  { value: 5, title: '<5', description: 'I prefer fewer than 5 outreaches per month' },
  { value: 10, title: '5-10', description: 'I can handle 5-10 outreaches per month' },
  { value: 20, title: '10-20', description: 'I\'m comfortable with 10-20 outreaches per month' },
  { value: 50, title: '20+', description: 'I can actively respond to 20+ outreaches per month' }
]

export function UserStatusCheckin({ 
  open, 
  onStatusUpdate,
}: UserStatusCheckinProps) {
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | null>(null)
  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null)
  const [selectedOutreachFrequency, setSelectedOutreachFrequency] = useState<number | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const needsTimeline = (status: UserStatus) => {
    return ['request_intros', 'recommend_opportunities', 'actively_searching'].includes(status)
  }

  const needsOutreach = (status: UserStatus) => {
    return status === 'open_to_outreach'
  }

  const handleStatusSelect = (status: UserStatus) => {
    
    setSelectedStatus(status)
    // Reset dependent fields when they are no longer needed
    if (!needsTimeline(status)) {
      setSelectedTimeline(null)
    }
    if (!needsOutreach(status)) {
      setSelectedOutreachFrequency(null)
    }
    
    // Auto-submit if this status doesn't need follow-up
    if (!needsTimeline(status) && !needsOutreach(status)) {
      handleSubmit(status)
    }
  }

  const handleTimelineSelect = (timeline: string) => {
    setSelectedTimeline(timeline)
    // Auto-submit when timeline is selected
    handleSubmit(selectedStatus, timeline)
  }

  const handleOutreachSelect = (frequency: number) => {
    setSelectedOutreachFrequency(frequency)
    // Auto-submit when outreach frequency is selected
    handleSubmit(selectedStatus, selectedTimeline, frequency)
  }

  const handleSubmit = async (status?: UserStatus | null, timeline?: string | null, outreachFreq?: number | null) => {
    
    const finalStatus = status || selectedStatus
    const finalTimeline = timeline || selectedTimeline
    const finalOutreach = outreachFreq || selectedOutreachFrequency
    
    if (!finalStatus) return
        
    try {
      // Call API to update user status
      const response = await fetch('/api/update_user_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: finalStatus,
          timeline: finalTimeline,
          outreach_frequency: finalOutreach
        }),
        credentials: 'include'
      })
      
      if (response.ok) {
        setIsSubmitted(true)
        // Wait a moment to show success, then call onStatusUpdate
        setTimeout(() => {
          onStatusUpdate(finalStatus, finalTimeline || undefined, finalOutreach || undefined)
        }, 1500)
      } else {
        console.error('Failed to update user status')
        // Still call onStatusUpdate to close dialog
        onStatusUpdate(finalStatus, finalTimeline || undefined, finalOutreach || undefined)
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      // Still call onStatusUpdate to close dialog
      onStatusUpdate(finalStatus, finalTimeline || undefined, finalOutreach || undefined)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
        <h3 className="text-xl font-semibold text-center dark:text-neutral-100">
          Thanks for the update!
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 text-center">
          If your status ever changes, you can update it on your profile.
        </p>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Update Your Status</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 rounded-lg p-4">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Where are you in your opportunity search?
          </div>
      
      <div className="space-y-6">
        {/* Status Selection - Always visible */}
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {statusOptions.map((option) => {
              const IconComponent = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusSelect(option.value)}
                  className={`p-3 rounded-lg border-2 transition-colors text-center ${
                    selectedStatus === option.value
                      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800'
                  } cursor-pointer`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <IconComponent className={`w-4 h-4 ${selectedStatus === option.value ? 'text-white dark:text-neutral-900' : 'text-neutral-700 dark:text-neutral-300'}`} />
                    <span className={`font-medium text-xs ${selectedStatus === option.value ? 'text-white dark:text-neutral-900' : 'text-neutral-900 dark:text-neutral-100'}`}>
                      {option.title}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          
        </div>

        {/* Timeline Selection - Show below status buttons */}
      <div className="space-y-6 rounded-lg p-4">
        {selectedStatus && needsTimeline(selectedStatus) && (
          <div className="space-y-4 border-t border-neutral-200 dark:border-neutral-700 pt-6">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  What is your timeline?
              </div>
              <div className="grid grid-cols-5 gap-2">
                {timelineOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleTimelineSelect(option.value)}
                    className={`p-3 rounded-lg border-2 transition-colors text-center ${
                      selectedTimeline === option.value
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800'
                    } cursor-pointer`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className={`font-medium text-xs ${selectedTimeline === option.value ? 'text-white dark:text-neutral-900' : 'text-neutral-900 dark:text-neutral-100'}`}>
                        {option.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
          
          </div>
        )}

        {/* Outreach Frequency Selection - Show below status buttons */}
        {selectedStatus && needsOutreach(selectedStatus) && (
          <div className="space-y-4 border-t border-neutral-200 dark:border-neutral-700 pt-6">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
                How many outreaches per month are you comfortable actively responding to?
            </div>
            <div className="grid grid-cols-4 gap-2">
              {outreachFrequencyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOutreachSelect(option.value)}
                  className={`p-3 rounded-lg border-2 transition-colors text-center ${
                    selectedOutreachFrequency === option.value
                      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800'
                  } cursor-pointer`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className={`font-medium text-xs ${selectedOutreachFrequency === option.value ? 'text-white dark:text-neutral-900' : 'text-neutral-900 dark:text-neutral-100'}`}>
                      {option.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
          </div>
          
          
        )}
        
       </div>

      </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}