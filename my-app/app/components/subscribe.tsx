'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2Icon, Terminal } from 'lucide-react'

import {GoogleLogin} from './google_login'
import { useSubscriptionContext } from './subscription_context';
import { useRouter } from 'next/navigation';

export function Subscribe({referral_id}: {referral_id?: number}) {
  const router = useRouter();
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [formError, setFormError] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [effectiveReferralId, setEffectiveReferralId] = useState<number | undefined>(referral_id)

  const {
    isSubscribed,
    refreshSubscription,
    userEmail,
    showSubscribeDialog,
    setShowSubscribeDialog,
  } = useSubscriptionContext();

  console.log("Subscribe component received referral_id:", referral_id, "isSubscribed:", isSubscribed, "showSubscribeDialog:", showSubscribeDialog);

  // Handle localStorage referral_id in useEffect to avoid SSR issues
  useEffect(() => {
    if (typeof window !== 'undefined' && !referral_id) {
      const storedReferralId = localStorage.getItem('referral_id');
      if (storedReferralId) {
        const parsed = parseInt(storedReferralId);
        if (!isNaN(parsed)) {
          setEffectiveReferralId(parsed);
        }
      }
    }
  }, [referral_id]);

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
      body: JSON.stringify({ email: userEmail, linkedin_url: linkedinUrl}),
    })

    const data = await res.json()
    
    if (res.ok && !data.existingSubscriber) {
      setFormSuccess(true)
      setFormError(false)
      setLinkedinUrl('')
      
      // Close dialog immediately to prevent "You're logged in" message
      setShowSubscribeDialog(false);

      console.log("Referral ID in subscribe component:", effectiveReferralId)
      
      // Make post_referral API call if referral_id exists
      if (effectiveReferralId && userEmail) {
        try {
          await fetch('/api/post_referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id: effectiveReferralId,
              referralEmail: userEmail
            }),
          })
        } catch (error) {
          console.error('Failed to post referral:', error)
        }
      }
      
      await refreshSubscription();
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
            <GoogleLogin buttonText="request access" flowType="subscribe" referral_id={effectiveReferralId} />
            {formSuccess && (
            <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Success! </AlertTitle>
            </Alert>
            )}
        </>
        )}

        <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
          <DialogTrigger asChild>
            <span style={{ display: 'none' }} />
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] p-8" showCloseButton={false}>
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
                <Button type="submit" disabled={isSubscribed}className="h-12 px-8 text-lg">request access</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
