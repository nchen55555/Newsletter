'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2Icon, Terminal } from 'lucide-react'

import {GoogleLogin} from './google_login'
import { useSubscriptionContext } from './subscription_context';
import { useRouter } from 'next/navigation';

export function Subscribe() {
  const router = useRouter();
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [formError, setFormError] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)

  const {
    isSubscribed,
    refreshSubscription,
    userEmail,
    showSubscribeDialog,
    setShowSubscribeDialog,
  } = useSubscriptionContext();

  const validateLinkedInUrl = (url: string): boolean => {
    const linkedinRegex = /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_]+\/?$/
    return linkedinRegex.test(url.trim())
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
      router.push('/profile')
    } else {
      setFormError(true)
    }
  }
  
    return (
    <div>
      <div className="flex flex-col w-full max-w-sm gap-4">
      { !isSubscribed && ( 
        <>
            <GoogleLogin buttonText="create my profile" flowType="subscribe" />
            {formSuccess && (
            <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Success! You have made your profile</AlertTitle>
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
              <DialogTitle className="text-2xl font-semibold">Creating Your Profile</DialogTitle>
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
                {isSubscribed && (
                  <Alert>
                  <CheckCircle2Icon />
                  <AlertTitle>You already have a profile! We&#39;ve logged you in</AlertTitle>
              </Alert>
                )}
                {formError && !isSubscribed && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Please enter a valid LinkedIn URL!</AlertTitle>
                  </Alert>
                )}
              </div>
              <DialogFooter className="mt-8 gap-4">
                <Button type="submit" disabled={isSubscribed}className="h-12 px-8 text-lg">access</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
