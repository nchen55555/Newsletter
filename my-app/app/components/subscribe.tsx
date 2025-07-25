'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2Icon, Terminal } from 'lucide-react'

import {GoogleLogin} from './google_login'
import { useSubscriptionContext } from './subscription_context';
import { Skeleton } from '@/components/ui/skeleton'

export function Subscribe() {
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [formError, setFormError] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [existingSubscriber, setExistingSubscriber] = useState(false)

  const {
    isSubscribed,
    refreshSubscription,
    loading,
    userEmail,
    showSubscribeDialog,
    setShowSubscribeDialog,
  } = useSubscriptionContext();

  const validateLinkedInUrl = (url: string): boolean => {
    const linkedinRegex = /^https:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+\/?$/
    return linkedinRegex.test(url)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userEmail || !linkedinUrl || !validateLinkedInUrl(linkedinUrl)) {
      setFormError(true)
      setFormSuccess(false)
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
      setFormError(false)
      setLinkedinUrl('')
      await refreshSubscription();
      setShowSubscribeDialog(false);

    } else {
      setExistingSubscriber(data.existingSubscriber)
      setFormError(true)
    }
  }
  
    return (
    <div>
      <div className="flex flex-col w-full max-w-sm gap-4">
      { !isSubscribed && ( 
        <>
            <GoogleLogin buttonText="access the niche today" flowType="subscribe" />
            {formSuccess && (
            <Alert>
                <CheckCircle2Icon />
                <AlertTitle>success! you&#39;re subscribed</AlertTitle>
            </Alert>
            )}
        </>
        )}

        <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
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
                  <Alert>
                  <CheckCircle2Icon />
                  <AlertTitle>You&#39;re already subscribed! We&#39;ve logged you in</AlertTitle>
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
                <Button type="submit" disabled={existingSubscriber}className="h-12 px-8 text-lg">subscribe</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
