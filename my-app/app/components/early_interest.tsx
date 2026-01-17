'use client'
import React from "react";
import { useState } from "react";
import { useSubscriptionContext } from "./subscription_context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileData } from "@/app/types";
import { useEffect } from "react";
import { ProfileFormState } from "@/app/types";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon, Terminal, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ProfileAvatar from "./profile_avatar";
import { Input } from "@/components/ui/input";

export default function EarlyInterestButton({ company, company_title }: { company: string, company_title: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isSubscribed } = useSubscriptionContext();
  const [data, setData] = useState<ProfileData | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [appError, setAppError] = useState<string | null>(null)
  const [appSuccess, setAppSuccess] = useState(false)
  const [loadingApplied, setLoadingApplied] = useState(false)
  const [isCalendarAuthFlow, setIsCalendarAuthFlow] = useState(false)
  const [appliedToNiche, setAppliedToNiche] = useState(false)
  const [form, setForm] = useState<ProfileFormState>({
    id: 0,
    email: "",
    first_name: "",
    last_name: "",
    linkedin_url: "",
    resume_url: "",
    personal_website: "",
    phone_number: "",
    resume_file: null,
    profile_image_url: "",
    profile_image: null,
    bio: "",
    is_public_profile: false,
    newsletter_opt_in: false,
    needs_visa_sponsorship: false,
    status: "",
    transcript_file: null,
    applied: false, 
    school: "",
  });
  const [access_token, setAccessToken] = useState<string | null>(null);

  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    
    (async () => {
      try {
        const res = await fetch("/api/get_profile", {
          credentials: "include",
          cache: "no-store",
          signal: ac.signal,
        });
        if (!res.ok) return;
        const profile = await res.json();

        setAppliedToNiche(profile.applied)

        // Destructure the fields you need
        setAccessToken(profile.access_token);
  
        // Set the form state
        setForm({
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          linkedin_url: profile.linkedin_url || "",
          resume_url: profile.resume_url || "",
          personal_website: profile.personal_website || "",
          phone_number: profile.phone_number || "",
          resume_file: null,
          profile_image_url: profile.profile_image_url || "",
          profile_image: null,
          bio: profile.bio || "",
          is_public_profile: profile.is_public_profile,
          newsletter_opt_in: profile.newsletter_opt_in,
          needs_visa_sponsorship: profile.needs_visa_sponsorship,
          status: profile.status,
          transcript_url: profile.transcript_url,
          transcript_file: null,
          applied: profile.applied,
          school: profile.school || "",
        });
  
        // Optionally set the raw data if you still need it
        setData(profile);
      } catch (e) {
        console.error("Failed to fetch profile:", e);
      } 
    })();

    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!form.id || !company) return; // wait until both are loaded
    fetch(`/api/get_early_interest?candidate_id=${form.id}&company_id=${company}`, { credentials: "include" })
      .then(res => res.json())
      .then(app => {
        const exists = typeof app.existing === 'string'
          ? app.existing.toLowerCase() === 'true'
          : !!app.existing;
        setApplied(exists);
      });     
  }, [form.id, company]);

  // Check if we should reopen dialog after calendar auth
  useEffect(() => {
    const dialogInfo = localStorage.getItem('calendarAuthDialogInfo');
    if (dialogInfo) {
      try {
        const { dialogType, company: storedCompany } = JSON.parse(dialogInfo);
        if (dialogType === 'early_interest' && storedCompany === company) {
          setIsCalendarAuthFlow(true);
          localStorage.removeItem('calendarAuthDialogInfo');
          // Small delay to ensure component is ready
          setTimeout(() => {
            setDialogOpen(true);
            setIsCalendarAuthFlow(false);
          }, 100);
        }
      } catch (error) {
        console.error('Failed to parse calendar auth dialog info:', error);
        localStorage.removeItem('calendarAuthDialogInfo');
      }
    }
  }, [company]);
  

  if (!isSubscribed) return null;

  async function handleEarlyInterest(e: React.FormEvent) {
    e.preventDefault()
    setLoadingApplied(true);
    setAppError(null);
    setAppSuccess(false);

    if (!form) {
      setAppError("Profile data not loaded. Please try again.");
      setLoadingApplied(false);
      return;
    }

    if (!form.bio) {
      setAppError("Bio is required.");
      setLoadingApplied(false);
      return;
    }

    const formData = new FormData();
    formData.append('bio', form.bio);
    
    // Handle resume: use file if provided, otherwise keep existing URL
    if (form.resume_file) {
      formData.append('resume_file', form.resume_file);
    } else if (!form.resume_url) {
      setAppError('Resume is required.');
      return;
    }

    // Handle profile image: use file if provided, otherwise keep existing URL
    if (form.profile_image) {
      formData.append('profile_image', form.profile_image);
    } else if (!form.profile_image_url) {
      setAppError('Profile image is required.');
      return;
    }

    // First, update the profile
    const res = await fetch('/api/post_profile', { 
      method: 'PATCH',
      body: formData 
    })
    
    if (!res.ok) {
        setAppError("Profile update failed")
        setLoadingApplied(false)
        return; // Stop here if profile update fails
    }

    // Only proceed with early interest submission if profile update succeeded
    const res2 = await fetch('/api/post_application', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        first_name: form.first_name, 
        company_title: company_title, 
        email: form.email,
        candidate_id: form.id,
        company_id: company,
        early_interest: true,
        additional_info: additionalInfo
      })
    })
    
    if (res2.ok) {
      setAppSuccess(true)
      setLoadingApplied(false)
    } else {
      setAppError("Early interest submission failed")
      setLoadingApplied(false)
    }
  }
  

  if (!data || isCalendarAuthFlow) return <Skeleton className="h-12 w-full" />; // or customize size;

  return (
    <div className="flex justify-center lg:justify-start mb-2">
  <TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <span>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setDialogOpen(true)}
          disabled={applied || !appliedToNiche}
          className="gap-2"
          style={applied ? { cursor: "not-allowed" } : {}}
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="hidden sm:inline">Express Early Interest</span>
        </Button>
      </span>
    </TooltipTrigger>
    {applied ? (
      <TooltipContent>
        You have already expressed early interest in this company.
      </TooltipContent>
    ) : !appliedToNiche ? (
      <TooltipContent>
        Complete your profile to express early interest.
      </TooltipContent>
    ) : null}
  </Tooltip>
</TooltipProvider>
  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <span style={{ display: 'none' }} />
          </DialogTrigger>
          <DialogContent className="!w-[95vw] !max-w-none sm:!max-w-[90vw] lg:!max-w-[85vw] xl:!max-w-[80vw] max-h-[90vh] p-4 sm:p-6 md:p-8 overflow-y-auto" showCloseButton={false}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-semibold">Express Early Interest</DialogTitle>
              <DialogDescription className="text-lg mt-2">
                We are currently processing our partnership with these companies! Pending partnership, we will directly connect you to the founder or head of talent for an initial discussion! <br></br><br></br><strong>Regardless of whether the partnership goes through, we will still try to make a connect for you.</strong> 
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEarlyInterest}>
  
            
            {/* <CalendarAuthGate 
              onAuthRequired={() => {
                setLoadingApplied(true);
                setIsCalendarAuthFlow(true);
              }}
              dialogType="early_interest"
              company={company}
            >
              {(hasCalendarAccess, isCheckingCalendar) => ( */}
                <>
                <div className="mb-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-6">
                {/* Left: Profile Picture (1/3rd) */}
                <div className="flex flex-col items-start lg:col-span-1">
                  <Label htmlFor="profile_picture" className="text-base font-medium mb-4">
                    Profile Picture <span className="text-red-500 ml-1">*</span>
                    <span className="text-sm text-gray-500 font-normal ml-2">(Max 2MB)</span>
                  </Label>
                  <ProfileAvatar
                    name={`${form.first_name || ''} ${form.last_name || ''}`.trim() || form.email || 'User'}
                    imageUrl={form.profile_image_url || undefined}
                    size={250}
                    shape="circle"
                    editable
                    onSelectFile={(file) => {
                      if (file && file.size > 2 * 1024 * 1024) {
                        alert('Profile image size must be less than 2MB');
                        return;
                      }
                      setForm(f => ({ ...f, profile_image: file || null }));
                    }}
                    className="w-64 h-64 rounded-full"
                  />
                </div>

                {/* Right: Bio and Resume (2/3rds) */}
                <div className="flex flex-col gap-4 lg:col-span-2">
                  <div>
                    <Label htmlFor="bio" className="text-base font-medium">Bio <span className="text-red-500 ml-1">*</span></Label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="I currently lead product at OpenMind, a Series A startup building out software to help robots learn from each other and operate in the real world. Prior to that, I launched Databrick's Agent Framework..."
                      className={`w-full min-h-[120px] text-sm px-4 py-3 mt-2 border rounded-lg resize-none`}
                    />
                  </div>

                  <div>
                    <Label htmlFor="resume_file" className="text-base font-medium">
                      Resume <span className="text-red-500 ml-1">*</span>
                      <span className="text-sm text-gray-500 font-normal ml-2">(Max 5MB)</span>
                    </Label>
                    <Input
                      id="resume_file"
                      name="resume_file"
                      type="file"
                      accept="application/pdf,.pdf,.doc,.docx"
                      onChange={e => {
                        const file = e.target.files && e.target.files[0];
                        if (file && file.size > 5 * 1024 * 1024) {
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
                  </div>
                 
                </div>
              </div>
                </div>
                <>
                <div className="mb-2">
                <Label htmlFor="add_info" className="text-base font-medium">
                  Connect Blurb <span className="text-neutral-500 ml-1">(Optional)</span>
                </Label>
                  <textarea 
                    id="add_info" 
                    name="add_info" 
                    value={additionalInfo} 
                    onChange={(e) => setAdditionalInfo(e.target.value)} 
                    required 
                    placeholder={"Tell us why you're interested in connecting and what draws you to this opportunity."} 
                    className={`w-full min-h-[120px] text-sm px-4 py-3 mt-2 border rounded-lg resize-none 'border-neutral-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'`}
                  />
                </div>
                
                </>
                <div className="flex justify-end mt-8 gap-4">
                  <Button 
                    type="submit" 
                    className="h-12 px-8 text-lg"
                    disabled={applied || loadingApplied } // || !hasCalendarAccess || isCheckingCalendar}
                  >
                    {applied ? "Already Submitted" : loadingApplied ? "Submitting..." : /*isCheckingCalendar ? "Checking..." : !hasCalendarAccess ? "Calendar Integration Required" :*/ "Submit Early Interest"}
                  </Button>
                </div>
                </>
                {appSuccess && (
                    <Alert className="mt-6">
                      <CheckCircle2Icon />
                      <AlertTitle>Early interest submitted successfully! We&apos;ll notify you when this company becomes a partner and if there is mutual interest.</AlertTitle>
                    </Alert>
                  )}
                  {appError && (
                    <Alert variant="destructive" className="mt-6">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>{appError}</AlertTitle>
                    </Alert>
                  )}
            </form>
          </DialogContent>
        </Dialog>
</div>

  );
}