'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2Icon, Terminal } from 'lucide-react'

import {GoogleLogin} from './google_login'
import { Skeleton } from '@/components/ui/skeleton'
import { useSubscriptionContext } from './subscription_context';


export function Subscribe({enableButton = true}: {enableButton?: boolean}) {
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formError, setFormError] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [existingSubscriber, setExistingSubscriber] = useState(false)

  // Check if we should show dialog on mount
//   useEffect(() => {
//     if (localStorage.getItem('googleAuthFlow') === 'subscribe') {
//       setDialogOpen(true)
//     }
//   }, [])

  const validateLinkedInUrl = (url: string): boolean => {
    const linkedinRegex = /^https:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+\/?$/
    return linkedinRegex.test(url)
  }


    const [loading, setLoading] = useState(false)
    const { isSubscribed } = useSubscriptionContext();


    // const checkSubscription = () => {
    //     setLoading(true)
    //     return fetch('/api/subscription')
    //         .then(res => res.json())
    //         .then(data => {
    //             setLoading(false)
    //             return data.isSubscribed
    //         })
    //         .catch(error => {
    //             console.error('Error checking subscription:', error)
    //             setLoading(false)
    //             return false
    //         })
    // }


  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userEmail || !linkedinUrl || !validateLinkedInUrl(linkedinUrl)) {
      setFormError(true)
      return
    }

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, linkedin_url: linkedinUrl }),
    })

    const data = await res.json()
    
    if (res.ok && !data.existingSubscriber) {
      setFormSuccess(true)
      setDialogOpen(false)
      setFormError(false)
      setLinkedinUrl('')
    //   checkSubscription()
    } else {
      setExistingSubscriber(data.existingSubscriber)
      setFormError(true)
    }
  }

  if (loading) {
    return (
    <div className="flex items-center space-x-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
    )
  }

    return (
    <div>
        {!isSubscribed && (
      <div className="flex flex-col w-full max-w-sm gap-4">
        <GoogleLogin 
          onSignInSuccess={(isSubscribed) => {
            if (isSubscribed) {
                console.log("User is subscribed")
                setExistingSubscriber(true)
            }
            setDialogOpen(true)
          }}
          onEmailChange={setUserEmail}
          buttonText="subscribe to get access" 
          redirectOnFail={false}
          flowType="subscribe" />
        
        {formSuccess && (
          <Alert>
            <CheckCircle2Icon />
            <AlertTitle>Success! You're subscribed.</AlertTitle>
          </Alert>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <span style={{ display: 'none' }} />
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] p-8" showCloseButton={false}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-semibold">Complete Your Subscription</DialogTitle>
              <DialogDescription className="text-lg mt-2">
                Thanks for verifying your email with Google. Now add your LinkedIn profile to complete your subscription.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormSubmit}>
              <div className="grid gap-8">
                <div className="grid gap-4">
                  <Label htmlFor="email" className="text-base font-medium">Email (verified)</Label>
                  <Input id="email" value={userEmail ?? ''} readOnly className="h-12 text-lg px-4 bg-gray-100" />
                </div>
                <div className="grid gap-4">
                  <Label htmlFor="linkedin" className="text-base font-medium">LinkedIn URL *</Label>
                  <Input
                    id="linkedin"
                    name="linkedin"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/..."
                    className="h-12 text-lg px-4"
                  />
                </div>
                {existingSubscriber && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>You are already subscribed! Please login to access your content.</AlertTitle>
                  </Alert>
                )}
                {formError && !existingSubscriber && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Please enter a valid LinkedIn URL!</AlertTitle>
                  </Alert>
                )}
              </div>
              <DialogFooter className="mt-8 gap-4">
                <Button type="submit" disabled={existingSubscriber}className="h-12 px-8 text-lg">Subscribe</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
        )}
    </div>
  )
}
