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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon, Terminal, Send } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export default function ApplyButton({ company }: { company: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isSubscribed } = useSubscriptionContext();
  const [data, setData] = useState<ProfileData | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [appError, setAppError] = useState<string | null>(null)
  const [appSuccess, setAppSuccess] = useState(false)
  const [loadingApplied, setLoadingApplied] = useState(false)
  const [profileSectionExpanded, setProfileSectionExpanded] = useState(false)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)
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

        // Check profile completeness
        const incomplete =
          !profile.resume_url ||
          !profile.first_name ||
          !profile.last_name ||
          !profile.phone_number ||
          !profile.bio || 
          !profile.linkedin_url ||
          !profile.profile_image_url;

        setProfileIncomplete(incomplete);

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
        });
  
        // Optionally set the raw data if you still need it
        setData(profile);
      } catch (e) {
        console.error("Failed to fetch profile:", e);
        setProfileIncomplete(false); // fail-closed
      } finally {
        setCheckingProfile(false);
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

  useEffect(() => {
    console.log('applied (rendered):', applied, typeof applied);
  }, [applied]);
  


  if (!isSubscribed) return null;

  async function urlToFile(url: string, filename: string, mimeType?: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType || blob.type });
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()

    if (!form) {
      setAppError("Profile data not loaded. Please try again.");
      return;
    }

    if (!form.first_name) {
      setAppError("First name is required.");
      return;
    }
    if (!form.last_name) {
      setAppError("Last name is required.");
      return;
    }
    if (!form.phone_number) {
      setAppError("Phone number is required.");
      return;
    }
    if (!form.linkedin_url) {
      setAppError("LinkedIn URL is required.");
      return;
    }

    if (!form.bio) {
      setAppError("Bio is required.");
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
    
    let resumeFile: File | null = form.resume_file ?? null;

    // If no new file, but we have a resume_url, fetch and convert to File
    if (!resumeFile && form.resume_url) {
      const filename = form.resume_url.split('/').pop() || 'resume.pdf';
      resumeFile = await urlToFile(form.resume_url, filename);
    }
    if (!resumeFile) {
      setAppError('Resume is required.');
      return;
    }

    formData.append('resume_file', resumeFile);

    let profileImageFile: File | null = form.profile_image ?? null;
    if (form.profile_image_url) {
      const filename = form.profile_image_url.split('/').pop() || 'profile.jpg';
      profileImageFile = await urlToFile(form.profile_image_url, filename);
    }
    if (!profileImageFile) {
      setAppError('Profile image is required.');
      return;
    }
    formData.append('profile_image', profileImageFile);

    let transcriptFile: File | null = form.transcript_file ?? null;
    if (!transcriptFile && form.transcript_url) {
      const filename = form.transcript_url.split('/').pop() || 'transcript.pdf';
      transcriptFile = await urlToFile(form.transcript_url, filename);
    }
    if (!transcriptFile) {
      setAppError('Transcript is required.');
      return;
    }
    formData.append('transcript_file', transcriptFile);


    // First, update the profile
    const res = await fetch('/api/post_profile', { method: 'PATCH',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
        body: formData })
    
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
        candidate_id: form.id,
        company_id: company,
        additional_info: additionalInfo
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


  if (!data) return <Skeleton className="h-12 w-full" />; // or customize size;


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
          aria-label="submit interest"
          disabled={applied}
          style={applied ? { cursor: "not-allowed" } : {}}
        >
          <Send className="w-4 h-4 mr-2" />
          submit interest
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
              <DialogTitle className="text-2xl font-semibold">Application of Interest</DialogTitle>
              <DialogDescription className="text-lg mt-2">
                In the notes section, indicate any additional information that you think would be beneficial for us and our partner companies to know and/or questions you have about the process, company, or more! 
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
                      <h3 className="text-lg font-medium text-neutral-800">Profile Information{' '}
                      {profileIncomplete && !checkingProfile && (
                      <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full">
                        Incomplete
                      </span>
                    )}
                    {!profileIncomplete && !checkingProfile && (
                      <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full">
                        Complete
                      </span>
                    )}
                      </h3>
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
            <div className="mb-10">
            <Label htmlFor="add_info" className="text-base font-medium">Intro Blurb</Label>
              <Input id="add_info" name="add_info" type="tel" value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} required placeholder="Write a quick sentence introduction to the founder of the company and any questions you have for them!" className="h-12 text-lg px-4 mt-2" />
              {appSuccess && (
                <Alert className="mt-6">
                  <CheckCircle2Icon />
                  <AlertTitle>Application submitted successfully!</AlertTitle>
                </Alert>
              )}
              {appError && (
                <Alert variant="destructive" className="mt-6">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>{appError}</AlertTitle>s
                </Alert>
              )}
            <div className="flex justify-end mt-8 gap-4">
              <Button onClick = {() => setLoadingApplied(true)} type="submit" className="h-12 px-8 text-lg">
              {loadingApplied ? "submitting..." : "submit"}
              </Button>
            </div>
            </div>
            </form>
          </DialogContent>
        </Dialog>
</div>

  );
}