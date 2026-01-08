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
import { CheckCircle2Icon, Terminal, Sparkle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";


export default function ApplyButton({
  company_title,
  company,
  person,
  isDemo = false,
  hiringTags = []
}: {
  company_title: string;
  company: string;
  person?: string;
  isDemo?: boolean;
  onIntroRequested?: () => void;
  hiringTags?: string[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isSubscribed } = useSubscriptionContext();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState(isDemo ? 'Demo!' : '');
  const [appError, setAppError] = useState<string | null>(null)
  const [appSuccess, setAppSuccess] = useState(false)
  const [loadingApplied, setLoadingApplied] = useState(false)
  const [isCalendarAuthFlow, setIsCalendarAuthFlow] = useState(false)
  const [appliedToNiche, setAppliedToNiche] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
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

    if(!form.resume_url) {
      setAppError("Please submit your resume")
    }
    if(!additionalInfo) {
      setAppError("Please submit your intro")
    }
    if(!selectedRole){
      setAppError("Please select a role")
    }

    // Only proceed with application if profile update succeeded
    const res2 = await fetch('/api/post_application', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        company_title: company_title,
        first_name: form.first_name, 
        email: form.email,
        candidate_id: form.id,
        company_id: company,
        additional_info: additionalInfo,
        role: selectedRole
      })
    })
    
    if (res2.ok) {
      // Close dialog immediately and redirect to success screen
      setDialogOpen(false)
      setLoadingApplied(false)
      router.push('/ats?loading=true')
    } else {
      setAppError("Application submission failed")
      setLoadingApplied(false)
    }
  }
  


  if (!data || isCalendarAuthFlow) return <Skeleton className="h-12 w-full" />; // or customize size;


  return (
    <div className="flex justify-center lg:justify-start">
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
        <Sparkle></Sparkle>
        <span className="hidden sm:inline">Request a Warm Intro </span>
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
          <DialogContent className="w-full p-8 overflow-y-auto" showCloseButton={false}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-semibold">Warm Intro Request</DialogTitle>
              <DialogDescription className="text-sm mt-2 text-neutral-200">
                In the intro blurb, provide a brief reason for your request and tag the specific opportunity you would like to discuss if any. We try to get back on your request as soon as possible! 
              </DialogDescription>
              {hiringTags && hiringTags.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-neutral-400 mb-2">Select a role</p>
                  <div className="flex flex-wrap gap-2">
                    {hiringTags.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(selectedRole === role ? null : role)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedRole === role
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                    <button
                      key="no-specific-role"
                      type="button"
                      onClick={() => setSelectedRole(selectedRole === 'No Specific Role' ? null : 'No Specific Role')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedRole === 'No Specific Role'
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      No Specific Role
                    </button>
                  </div>
                </div>
              )}
              <div className="py-6 grid w-full max-w-sm items-center gap-3">
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
                </div>
            </DialogHeader>
            <form onSubmit={handleApply}>
            {/* <div className="mb-10"> */}
              {/* <div className="border border-neutral-200 rounded-lg"> */}
                {/* <button
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
                )} */}
              {/* </div> */}
            {/* </div> */}
            
            {/* <CalendarAuthGate 
              onAuthRequired={() => {
                setLoadingApplied(true);
                setIsCalendarAuthFlow(true);
              }}
              dialogType="apply"
              company={company}
              person={person}
            >
              {(hasCalendarAccess, isCheckingCalendar) => ( */}
                <>
                <div className="mb-10">
                <Label htmlFor="add_info" className="text-base font-medium">
                  Intro Blurb
                  {isDemo && <span className="ml-2 text-sm text-gray-600">(Demo Mode)</span>}
                </Label>
                  <textarea 
                    id="add_info" 
                    name="add_info" 
                    value={additionalInfo} 
                    onChange={(e) => !isDemo && setAdditionalInfo(e.target.value)} 
                    required 
                    placeholder={isDemo ? "Demo mode - text is pre-filled" : "Tell us why you're interested in connecting and what draws you to this opportunity."} 
                    className={`w-full min-h-[120px] text-sm px-4 py-3 mt-2 border rounded-lg resize-none ${
                      isDemo 
                        ? 'border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed' 
                        : 'border-neutral-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    readOnly={isDemo}
                  />
                  {isDemo && (
                    <p className="text-sm text-gray-600 mt-2">
                      ✨ in demo mode, the intro text is automatically filled with &quot;Demo!&quot; and will not actually be sent.
                    </p>
                  )}
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
                    disabled={applied || loadingApplied} // || !hasCalendarAccess || isCheckingCalendar}
                  >
                    {applied ? "Already Submitted" : loadingApplied ? "Submitting..." /*: isCheckingCalendar ? "Checking..." : !hasCalendarAccess ? "Calendar Integration Required"*/ : "Submit"}
                  </Button>
                </div>
                </>
              {/* )}
            </CalendarAuthGate> */}
            </form>
          </DialogContent>
        </Dialog>
</div>

  );
}