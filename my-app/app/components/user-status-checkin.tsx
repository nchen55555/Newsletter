'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, MessageCircle, UserPlus, Target, Search, ArrowRight} from 'lucide-react'

type UserStatus = 'perusing' | 'open_to_outreach' | 'request_intros' | 'recommend_opportunities' | 'actively_searching'

interface UserStatusCheckinProps {
  open: boolean
  onStatusUpdate: (status: UserStatus, timeline?: string, outreachFrequency?: number) => void
  userName?: string
}

const statusOptions = [
  {
    value: 'perusing' as UserStatus,
    title: 'Just Perusing',
    description: 'Browsing the platform to see what\'s available',
    icon: Eye
  },
  {
    value: 'open_to_outreach' as UserStatus,
    title: 'Open to Founder Outreaches',
    description: 'Interested in connecting with founders and open to new opportunities',
    icon: MessageCircle
  },
  {
    value: 'request_intros' as UserStatus,
    title: 'Curious about Intros',
    description: 'Curious with the intention to request introductions to specific companies',
    icon: UserPlus
  },
  {
    value: 'recommend_opportunities' as UserStatus,
    title: 'Will Request Intros',
    description: 'Want personalized recommendations and introductions',
    icon: Target
  },
  {
    value: 'actively_searching' as UserStatus,
    title: 'Actively Searching for New Opportunities',
    description: 'Ready to move and actively seeking new opportunities',
    icon: Search
  }
]

const timelineOptions = [
  { value: 'immediate', title: 'Immediate', description: 'Ready to hop on an intro call and interview now' },
  { value: 'short_term', title: 'Short term', description: 'Ready to hop on an intro call but interview in about a month' },
  { value: 'medium_term', title: 'Medium term', description: 'Ready to hope on an intro call but actually interview in about 3-6 months' },
  { value: 'long_term', title: 'Long term', description: 'Ready to hop on an intro call but maybe hold off on an actual interview' },
  { value: 'flexible', title: 'Flexible', description: 'No timeline' }
]

const outreachFrequencyOptions = [
  { value: 5, title: '<5', description: 'I prefer fewer than 5 outreaches per month' },
  { value: 10, title: '5-10', description: 'I can handle 5-10 outreaches per month' },
  { value: 20, title: '10-20', description: 'I\'m comfortable with 10-20 outreaches per month' },
  { value: 50, title: '20+', description: 'I can actively respond to 20+ outreaches per month' }
]

export function UserStatusCheckin({ open, onStatusUpdate, userName }: UserStatusCheckinProps) {
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | null>(null)

  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null)
  const [selectedOutreachFrequency, setSelectedOutreachFrequency] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  }

  const handleTimelineSelect = (timeline: string) => {
    setSelectedTimeline(timeline)
  }

  const handleOutreachSelect = (frequency: number) => {
    setSelectedOutreachFrequency(frequency)
  }

  const handleSubmit = async (status?: UserStatus, timeline?: string, outreachFreq?: number) => {
    const finalStatus = status || selectedStatus
    const finalTimeline = timeline || selectedTimeline
    const finalOutreach = outreachFreq || selectedOutreachFrequency
    
    if (!finalStatus) return
    
    setIsSubmitting(true)
    
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
    } finally {
      setIsSubmitting(false)
    }
  }


  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md w-full px-8 py-8 [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <h3 className="text-xl font-semibold text-center">
              Thanks for the update!
            </h3>
            <p className="text-sm text-neutral-600 text-center">
              If your status ever changes, you can update it on your profile.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-3xl w-full px-8 py-8 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Status Check-in{userName ? `, ${userName}` : ''}
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Where are you in your opportunity search?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
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
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <IconComponent className={`w-4 h-4 ${selectedStatus === option.value ? 'text-white' : 'text-neutral-700'}`} />
                      <span className={`font-medium text-xs ${selectedStatus === option.value ? 'text-white' : 'text-neutral-900'}`}>
                        {option.title}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
            
            {/* Show description for selected status */}
            {selectedStatus && (
              <div className="text-center">
                <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
                  {statusOptions.find(option => option.value === selectedStatus)?.description}
                </p>
              </div>
            )}
          </div>

          {/* Timeline Selection - Show below status buttons */}
          {selectedStatus && needsTimeline(selectedStatus) && (
            <div className="space-y-4 border-t border-neutral-200 pt-6">
              <h4 className="text-lg font-semibold text-neutral-900">When would you be ready to start interviewing?</h4>
              <div className="grid gap-3">
                {timelineOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleTimelineSelect(option.value)}
                    className={`p-4 rounded-lg border-2 transition-colors text-left ${
                      selectedTimeline === option.value
                        ? 'border-neutral-900 bg-white shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-neutral-900 block">{option.title}</span>
                        <span className="text-sm text-neutral-600">{option.description}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => handleSubmit()}
                  disabled={!selectedTimeline || isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 text-lg bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Complete'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Outreach Frequency Selection - Show below status buttons */}
          {selectedStatus && needsOutreach(selectedStatus) && (
            <div className="space-y-4 border-t border-neutral-200 pt-6">
              <h4 className="text-lg font-semibold text-neutral-900">How many outreaches per month are you comfortable actively responding to?</h4>
              <div className="grid gap-3">
                {outreachFrequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOutreachSelect(option.value)}
                    className={`p-4 rounded-lg border-2 transition-colors text-left ${
                      selectedOutreachFrequency === option.value
                        ? 'border-neutral-900 bg-white shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-neutral-900 block">{option.title}</span>
                        <span className="text-sm text-neutral-600">{option.description}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => handleSubmit()}
                  disabled={selectedOutreachFrequency === null || isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 text-lg bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Complete'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Submit button for statuses that don't need follow-up */}
          {selectedStatus && !needsTimeline(selectedStatus) && !needsOutreach(selectedStatus) && (
            <div className="border-t border-neutral-200 pt-6">
              <div className="flex justify-end">
                <Button
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 text-lg bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Complete'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}