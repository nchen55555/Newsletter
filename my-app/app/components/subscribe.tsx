'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2Icon, Terminal, Loader2 } from 'lucide-react'

import {GoogleLogin} from './google_login'
import { useSubscriptionContext } from './subscription_context';
import { useRouter } from 'next/navigation';
import { ProfileFormState } from '@/app/types';

export function Subscribe({referral_id}: {referral_id?: number}) {
  const router = useRouter();
  const [effectiveReferralId, setEffectiveReferralId] = useState<number | undefined>(referral_id)
  const {
    isSubscribed,
    refreshSubscription,
    userEmail,
    showSubscribeDialog,
    setShowSubscribeDialog,
  } = useSubscriptionContext();

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

  const [form, setForm] = useState<ProfileFormState>({
    id: 0, 
    school: "",
    personal_website: "",
    bio: "",
    email: userEmail ?? "",
    first_name: "",
    last_name: "",
    linkedin_url: "",
    resume_url: "",
    phone_number: "",
    resume_file: null,
    is_public_profile: false,
    newsletter_opt_in: false,
    needs_visa_sponsorship: false,
  });

  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)
  const [loading, setLoading] = useState(false) // <-- new loading states

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(false)
    setLoading(true) // start loading

    try {
      if (!form.first_name) {
        setFormError("First name is required.");
        return;
      }
      if (!form.last_name) {
        setFormError("Last name is required.");
        return;
      }
      if (!form.phone_number) {
        setFormError("Phone number is required.");
        return;
      }
      if (!form.linkedin_url || !validateLinkedInUrl(form.linkedin_url)) {
        setFormError("LinkedIn URL is required.");
        return;
      }

      const formData = new FormData();
      formData.append('first_name', form.first_name);
      formData.append('last_name', form.last_name);
      formData.append('linkedin_url', form.linkedin_url);
      formData.append('phone_number', form.phone_number);
      formData.append('email', userEmail ?? form.email)
      // formData.append('is_public_profile', form.is_public_profile.toString());
      // formData.append('newsletter_opt_in', form.newsletter_opt_in.toString());
      // formData.append('needs_visa_sponsorship', form.needs_visa_sponsorship.toString());

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
          // Clear referral_id from localStorage after successful use
          localStorage.removeItem('referral_id');
        } catch (error) {
          console.error('Failed to post referral:', error)
        }
      }
      
      const res = await fetch('/api/subscribe', { 
        method: 'POST',
        body: formData 
      })

      if (res.ok) {
        setFormSuccess(true)
        setShowSubscribeDialog(false) // Close dialog immediately
        refreshSubscription()
        router.push('/profile?flow=onboarding')
      } else {
        setFormError(`Update failed, check your fields! Your files may be too large`)
      }
    } catch (e) {
      console.error("Failed to update profile:", e);
      setFormError('An unexpected error occurred.')
    } finally {
      setLoading(false) // stop loading
    }
    
  }
  
    return (
    <div>
      <div className="flex flex-col w-full max-w-sm gap-4">
      { !isSubscribed && ( 
        <>
            <GoogleLogin buttonText="create profile" flowType="subscribe" referral_id={effectiveReferralId} />
            {formSuccess && (
            <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Success! </AlertTitle>
            </Alert>
            )}
        </>
        )}

        <Dialog open={showSubscribeDialog} onOpenChange={() => setShowSubscribeDialog(true)}>
          <DialogTrigger asChild>
            <span style={{ display: 'none' }} />
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[600px] p-8 max-h-[80vh] overflow-y-auto"
            showCloseButton={false}
          >
            <form onSubmit={handleFormSubmit}>
              <div className="grid gap-8">
                <div className="grid gap-4">
                  <Label htmlFor="email" className="text-base font-medium">Email (verified)</Label>
                  <Input id="email" value={userEmail ?? ''} readOnly className="h-12 text-lg px-4 bg-gray-100" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName" className="text-base font-medium">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="First Name"
                      value={form.first_name}
                      onChange={(e) => setForm(prev => ({ ...prev, first_name: e.target.value }))}
                      className="h-12 text-lg px-4"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName" className="text-base font-medium">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Last Name"
                      value={form.last_name}
                      onChange={(e) => setForm(prev => ({ ...prev, last_name: e.target.value }))}
                      className="h-12 text-lg px-4"
                    />
                  </div>
                </div>
                <div className="grid gap-4">
                  <Label htmlFor="linkedin" className="text-base font-medium">LinkedIn URL *</Label>
                  <Input
                    id="linkedin"
                    name="linkedin"
                    value={form.linkedin_url}
                    onChange={(e) => setForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    placeholder="https://www.linkedin.com/in/..."
                    className="h-12 text-lg px-4"
                  />
                </div>

                <div className="grid gap-4">
                  <Label htmlFor="linkedin" className="text-base font-medium">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={(e) => setForm(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="e.g. 555-123-4567"
                    className="h-12 text-lg px-4"
                  />
                </div>

                {/* <div className="py-6 grid w-full max-w-sm items-center gap-3">
                  <Label htmlFor="resume_file" className="text-base font-medium">Resume <span className="text-sm text-gray-500 font-normal">(Max 5MB)</span></Label>
                  <Input
                    id="resume_file"
                    name="resume_file"
                    type="file"
                    accept="application/pdf,.pdf,.doc,.docx"
                    onChange={e => {
                      const file = e.target.files && e.target.files[0];
                      if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
                        alert('Resume file size must be less than 5MB');
                        e.target.value = '';
                        return;
                      }
                      setForm(prev => ({ ...prev, resume_file: file || null }));
                    }}
                    className="block w-full text-lg mt-2"
                  />
                  {form.resume_file && (
                    <div className="mt-2 text-sm text-gray-700">Selected: {form.resume_file.name}</div>
                  )}
                  {!form.resume_file && form.resume_url && (
                    <div className="mt-2 text-sm text-gray-700">
                      Current resume: <a href={form.resume_url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">View uploaded resume</a>
                    </div>
                  )}
                </div> */}

                {/* Onboarding preference toggles (same questions as profile_info_chatbot) */}
                {/* <div className="grid gap-6">
                  <div className="space-y-2">
                    <p className="text-base font-medium">
                      Allow founders to view and reach out to your Niche profile?
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Allow your profile to be public to our partner companies for warm intros.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, is_public_profile: true }))}
                        className={`flex-1 py-2 text-sm ${
                          form.is_public_profile === true
                            ? 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                            : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, is_public_profile: false }))}
                        className={`flex-1 py-2 text-sm ${
                          form.is_public_profile === false
                            ? 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                            : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-base font-medium">
                      Stay updated with new company profiles?
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Get an email when we cover a new company. We drop a maximum of two company profiles each week.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, newsletter_opt_in: true }))}
                        className={`flex-1 py-2 text-sm ${
                          form.newsletter_opt_in === true
                            ? 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                            : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, newsletter_opt_in: false }))}
                        className={`flex-1 py-2 text-sm ${
                          form.newsletter_opt_in === false
                            ? 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                            : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-base font-medium">
                      Do you need visa sponsorship?
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      For employment in the US.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, needs_visa_sponsorship: true }))}
                        className={`flex-1 py-2 text-sm ${
                          form.needs_visa_sponsorship === true
                            ? 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                            : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, needs_visa_sponsorship: false }))}
                        className={`flex-1 py-2 text-sm ${
                          form.needs_visa_sponsorship === false
                            ? 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                            : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </div> 
                */}
                {isSubscribed && (
                  <Alert>
                  <CheckCircle2Icon />
                  <AlertTitle>You already have a profile! We&#39;ve logged you in</AlertTitle>
              </Alert>
                )}
                {formError && !isSubscribed && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{formError}</AlertTitle>
                  </Alert>
                )}
              </div>
              <DialogFooter className="mt-8 gap-4">
                <Button type="submit" disabled={isSubscribed || loading} className="h-12 px-8 text-lg">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      submitting...
                    </>
                  ) : (
                    'continue'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
