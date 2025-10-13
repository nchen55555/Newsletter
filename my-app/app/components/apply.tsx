'use client'
import React from "react";
import { useState } from "react";
import { useSubscriptionContext } from "./subscription_context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileData } from "@/app/types";
import { useEffect } from "react";
import ProfileInfo from "./profile_info";
import { ProfileFormState } from "@/app/types";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon, Terminal, Send } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CalendarAuthGate from "./calendar_auth_gate";


export default function ApplyButton({ company, person }: { company: string; person?: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isSubscribed } = useSubscriptionContext();
  const [data, setData] = useState<ProfileData | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [appError, setAppError] = useState<string | null>(null)
  const [appSuccess, setAppSuccess] = useState(false)
  const [loadingApplied, setLoadingApplied] = useState(false)
  const [isCalendarAuthFlow, setIsCalendarAuthFlow] = useState(false)
  const [profileSectionExpanded, setProfileSectionExpanded] = useState(false)
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
    status: "",
    transcript_file: null,
    applied: false, 
    school: "",
    needs_visa_sponsorship: false,
  });
  const [access_token, setAccessToken] = useState<string | null>(null);

  const [applied, setApplied] = useState(false);

  // const [isCohortMember, setIsCohortMember] = useState(false)

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

        // setIsCohortMember(profile.status == 'COHORT')


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
          status: profile.status,
          transcript_url: profile.transcript_url,
          transcript_file: null,
          applied: profile.applied,
          school: profile.school || "",
          needs_visa_sponsorship: profile.needs_visa_sponsorship,
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
    fetch(`/api/get_application?candidate_id=${form.id}&company_id=${company}`, { credentials: "include" })
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
        const { dialogType, company: storedCompany, person: storedPerson } = JSON.parse(dialogInfo);
        if (dialogType === 'apply' && storedCompany === company && storedPerson === person) {
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
  }, [company, person]);
  


  if (!isSubscribed) return null;



  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setLoadingApplied(true);
    setAppError(null);
    setAppSuccess(false);

    if (!form) {
      setAppError("Profile data not loaded. Please try again.");
      setLoadingApplied(false);
      return;
    }

    if (!form.first_name) {
      setAppError("First name is required.");
      setLoadingApplied(false);
      return;
    }
    if (!form.last_name) {
      setAppError("Last name is required.");
      setLoadingApplied(false);
      return;
    }
    if (!form.phone_number) {
      setAppError("Phone number is required.");
      setLoadingApplied(false);
      return;
    }
    if (!form.linkedin_url) {
      setAppError("LinkedIn URL is required.");
      setLoadingApplied(false);
      return;
    }

    if (!form.bio) {
      setAppError("Bio is required.");
      setLoadingApplied(false);
      return;
    }

    const formData = new FormData();
    formData.append('id', form.id.toString());
    formData.append('first_name', form.first_name);
    formData.append('last_name', form.last_name);
    formData.append('linkedin_url', form.linkedin_url);
    formData.append('personal_website', form.personal_website);
    formData.append('phone_number', form.phone_number);
    formData.append('email', form.email)
    formData.append('bio', form.bio);
    
    // Add boolean toggle values (convert to string for FormData)
    formData.append('is_public_profile', form.is_public_profile.toString());
    formData.append('newsletter_opt_in', form.newsletter_opt_in.toString());
    formData.append('needs_visa_sponsorship', form.needs_visa_sponsorship.toString());
    
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

    // Handle transcript: use file if provided, otherwise keep existing URL
    if (form.transcript_file) {
      formData.append('transcript_file', form.transcript_file);
    } else if (!form.transcript_url) {
      setAppError('Transcript is required.');
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

    // Only proceed with application if profile update succeeded
    const res2 = await fetch('/api/post_application', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        first_name: form.first_name, 
        email: form.email,
        candidate_id: form.id,
        company_id: company,
        additional_info: additionalInfo,
        person: person
      })
    })
    
    if (res2.ok) {
      setAppSuccess(true)
      setLoadingApplied(false)
    } else {
      setAppError("Application submission failed")
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
          onClick={() => setDialogOpen(true)}
          variant="default"
          className="inline-flex items-center justify-center bg-neutral-900 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-neutral-800 transition-colors text-sm w-full"
          type="button"
          aria-label="request an intro"
          disabled={applied || !appliedToNiche}
          style={applied ? { cursor: "not-allowed" } : {}}
        >
          <Send className="w-4 h-4 mr-2" />
          request an intro
        </Button>
      </span>
    </TooltipTrigger>
    {applied && (
      <TooltipContent>
        You have already applied to this company.
      </TooltipContent>
    )}
  </Tooltip>
</TooltipProvider>
  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <span style={{ display: 'none' }} />
          </DialogTrigger>
          <DialogContent className="sm:max-w-5xl w-full p-8 max-h-[80vh] overflow-y-auto" showCloseButton={false}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-semibold">Connecting you to {person}</DialogTitle>
              <DialogDescription className="text-lg mt-2">
                In the intro blurb below, provide a brief background of why you want to meet {person} and what excites you about connecting to the company!
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleApply}>
            <div className="mb-10">
              <div className="border border-neutral-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setProfileSectionExpanded(!profileSectionExpanded)}
                  className="flex items-center justify-between w-full p-4 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm text-neutral-600">Review and update your profile details</p>
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-neutral-600 transition-transform ${profileSectionExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {profileSectionExpanded && (
                  <div className="px-4 pb-4 border-t border-neutral-200">
                    <ProfileInfo form={form} setForm={setForm} />
                  </div>
                )}
              </div>
            </div>
            
            <CalendarAuthGate 
              onAuthRequired={() => {
                setLoadingApplied(true);
                setIsCalendarAuthFlow(true);
              }}
              dialogType="apply"
              company={company}
              person={person}
            >
              {(hasCalendarAccess, isCheckingCalendar) => (
                <>
                <div className="mb-10">
                <Label htmlFor="add_info" className="text-base font-medium">Intro Blurb</Label>
                  <textarea 
                    id="add_info" 
                    name="add_info" 
                    value={additionalInfo} 
                    onChange={(e) => setAdditionalInfo(e.target.value)} 
                    required 
                    placeholder="Tell us why you're interested in connecting and what draws you to this opportunity." 
                    className="w-full min-h-[120px] text-lg px-4 py-3 mt-2 border border-neutral-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {appSuccess && (
                    <Alert className="mt-6">
                      <CheckCircle2Icon />
                      <AlertTitle>Request to the company submitted!</AlertTitle>
                    </Alert>
                  )}
                  {appError && (
                    <Alert variant="destructive" className="mt-6">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>{appError}</AlertTitle>s
                    </Alert>
                  )}
                </div>
                
                <div className="flex justify-end mt-8 gap-4">
                  <Button 
                    type="submit" 
                    className="h-12 px-8 text-lg"
                    disabled={applied || loadingApplied || !hasCalendarAccess || isCheckingCalendar}
                  >
                    {applied ? "Already Submitted" : loadingApplied ? "Submitting..." : isCheckingCalendar ? "Checking..." : !hasCalendarAccess ? "Calendar Integration Required" : "Submit"}
                  </Button>
                </div>
                </>
              )}
            </CalendarAuthGate>
            </form>
          </DialogContent>
        </Dialog>
</div>

  );
}