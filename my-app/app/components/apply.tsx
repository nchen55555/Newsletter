'use client'
import React from "react";
import { useState } from "react";
import { useSubscriptionContext } from "./subscription_context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import ProfileAvatar from "./profile_avatar";

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
  const [warmIntroAvailable, setWarmIntroAvailable] = useState<boolean | null>(null);
  const [isLoadingWarmIntro, setIsLoadingWarmIntro] = useState(true);

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

  // Fetch warm intro availability
  useEffect(() => {
    if (!company) return;

    const fetchWarmIntro = async () => {
      try {
        const response = await fetch(`/api/companies/${company}/warm_intro`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setWarmIntroAvailable(data.warm_intro_available);
        } else {
          setWarmIntroAvailable(false);
        }
      } catch (error) {
        console.error('Error fetching warm intro status:', error);
        setWarmIntroAvailable(false);
      } finally {
        setIsLoadingWarmIntro(false);
      }
    };

    fetchWarmIntro();
  }, [company]);

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

    if(!form.resume_url && !form.resume_file) {
      setAppError("Please submit your resume")
      setLoadingApplied(false)
      return
    }
    if(!additionalInfo) {
      setAppError("Please submit your intro")
      setLoadingApplied(false)
      return
    }
    if(!selectedRole){
      setAppError("Please select a role")
      setLoadingApplied(false)
      return
    }

    // Update profile if any changes were made
    const profileFormData = new FormData()
    let hasProfileChanges = false

    // Add profile_image if changed
    if (form.profile_image) {
      profileFormData.append('profile_image', form.profile_image)
      hasProfileChanges = true
    }

    // Add resume_file if changed
    if (form.resume_file) {
      profileFormData.append('resume_file', form.resume_file)
      hasProfileChanges = true
    }

    // Add bio if it exists
    if (form.bio) {
      profileFormData.append('bio', form.bio)
      hasProfileChanges = true
    }

    // Add id for folder path determination
    profileFormData.append('id', String(form.id))

    // Post profile updates if any changes were made
    if (hasProfileChanges) {
      const profileRes = await fetch('/api/post_profile', {
        method: 'POST',
        credentials: 'include',
        body: profileFormData
      })

      if (!profileRes.ok) {
        setAppError("Failed to update profile")
        setLoadingApplied(false)
        return
      }

      // Update form state with returned URLs
      const profileData = await profileRes.json()
      if (profileData.resumeUrl) {
        setForm(prev => ({ ...prev, resume_url: profileData.resumeUrl }))
      }
      if (profileData.profileImageUrl) {
        setForm(prev => ({ ...prev, profile_image_url: profileData.profileImageUrl }))
      }
    }

    // Proceed with application submission
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
        disabled={applied || !appliedToNiche || isLoadingWarmIntro || warmIntroAvailable === false}
        className="gap-2"
        style={(applied || warmIntroAvailable === false) ? { cursor: "not-allowed" } : {}}
      >
        <Sparkle></Sparkle>
        <span className="hidden sm:inline">Request a Warm Intro </span>
      </Button>
      </span>
    </TooltipTrigger>
    {applied ? (
      <TooltipContent>
        You have already applied to this company.
      </TooltipContent>
    ) : !appliedToNiche ? (
      <TooltipContent>
        Complete your profile to request warm intros.
      </TooltipContent>
    ) : warmIntroAvailable === false ? (
      <TooltipContent>
        Your network isn&apos;t a strong enough signal to give you a warm intro here yet. Continue building your verified network to unlock warm introductions.
      </TooltipContent>
    ) : null}
  </Tooltip>
</TooltipProvider>
  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <span style={{ display: 'none' }} />
          </DialogTrigger>
          <DialogContent className="!w-[95vw] !max-w-none sm:!max-w-[90vw] lg:!max-w-[85vw] xl:!max-w-[80vw] max-h-[90vh] p-4 sm:p-6 md:p-8 overflow-y-auto" showCloseButton={false}>
            <DialogHeader className="mb-2">
              <DialogTitle className="text-2xl font-semibold">Warm Intro Request</DialogTitle>

              {/* Profile Picture and Bio Side by Side */}
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
                  {hiringTags && hiringTags.length > 0 && (
                <div className="mt-4">
                  <Label htmlFor="role" className="text-base font-medium mb-4">Role <span className="text-red-500 ml-1">*</span> </Label>
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
                </div>
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
                <div className="mb-2">
                <Label htmlFor="add_info" className="text-base font-medium">
                  Connect Blurb <span className="text-red-500 ml-1">*</span>
                  {isDemo && <span className="ml-2 text-sm text-gray-600">(Demo Mode)</span>}
                </Label>
                  <textarea 
                    id="add_info" 
                    name="add_info" 
                    value={additionalInfo} 
                    onChange={(e) => !isDemo && setAdditionalInfo(e.target.value)} 
                    required 
                    placeholder={isDemo ? "Demo mode - text is pre-filled" : "What are you interested in connecting about?"} 
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
                
                <div className="flex justify-end gap-4">
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