'use client'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import ProfileInfo from './profile_info'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProfileFormState, ProfileData } from '@/app/types'
import { useSubscriptionContext } from './subscription_context'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Terminal } from 'lucide-react'
import CompanyCards from '@/app/companies/company-cards'
import { CompanyWithImageUrl } from '@/app/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MultiStepProfileFormProps extends ProfileData {
  access_token: string,
}



export default function MultiStepProfileForm(props: MultiStepProfileFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSubscribed } = useSubscriptionContext()
  const [currentStep, setCurrentStep] = useState(0)
  const [companies, setCompanies] = useState<CompanyWithImageUrl[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [, setEmailSent] = useState(false)


  useEffect(() => {
    if (!isSubscribed) {
      router.push("/"); 
    }
  }, [isSubscribed, router]);

  // Read step from URL parameter on component mount
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam !== null) {
      const step = parseInt(stepParam, 10);
      if (step >= 0 && step <= 3) {
        setCurrentStep(step);
        // Load companies if navigating directly to step 2
        if (step === 2 && companies.length === 0) {
          loadCompanies();
        }
      }
    }
  }, [searchParams, companies.length]);

  // Update URL when step changes
  const updateStep = (step: number) => {
    setCurrentStep(step);
    const params = new URLSearchParams(searchParams.toString());
    params.set('step', step.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const [form, setForm] = useState<ProfileFormState>({
    id: props.id,
    email: props.email,
    first_name: props.first_name || "",
    last_name: props.last_name || "",
    linkedin_url: props.linkedin_url || "",
    resume_url: props.resume_url || "",
    personal_website: props.personal_website || "",
    phone_number: props.phone_number || "",
    resume_file: null,
    profile_image_url: props.profile_image_url || null,
    profile_image: null,
    bio: props.bio || "",
    is_public_profile: props.is_public_profile || false,
    newsletter_opt_in: props.newsletter_opt_in || false,
    status: props.status || "",
    transcript_file: null,
    transcript_url: props.transcript_url || "",
    applied: props.applied || false,
    parsed_resume_json: "",
  });

  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Load companies for step 2 (same query as companies page, limited to 20)


  const loadCompanies = async () => {
    setLoadingCompanies(true)
    try {
        const response = await fetch('/api/companies')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch companies: ${response.status}`)
        }
        
        const companies = await response.json()
        
        console.log('Companies fetched from API:', companies.length, companies)
        setCompanies(companies)
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  const handleFinishSetup = async () => {
    try {
      // Send welcome email
      const response = await fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email, 
          first_name: form.first_name, 
          last_name: form.last_name
        })
      });

      if (response.ok) {
        console.log('Welcome email sent successfully');
        setEmailSent(true);
      } else {
        console.error('Failed to send welcome email');
        setEmailSent(false);
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      setEmailSent(false);
    }
    
    // Show confirmation dialog
    setShowConfirmation(true);
    
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    router.push("/profile");
  };

  async function urlToFile(url: string, filename: string, mimeType?: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType || blob.type });
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setLoading(true)

    try {
      // Validate required fields (same as original form)
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
      if (!form.linkedin_url) {
        setFormError("LinkedIn URL is required.");
        return;
      }
      if (!form.bio) {
        setFormError("Bio is required.");
        return;
      }

      // Build form data (same as original form)
      const formData = new FormData();
      formData.append('id', form.id.toString());
      formData.append('first_name', form.first_name);
      formData.append('last_name', form.last_name);
      formData.append('linkedin_url', form.linkedin_url);
      formData.append('personal_website', form.personal_website);
      formData.append('phone_number', form.phone_number);
      formData.append('email', form.email);
      formData.append('bio', form.bio);
      formData.append('is_public_profile', form.is_public_profile.toString());
      formData.append('newsletter_opt_in', form.newsletter_opt_in.toString());
    
      
      // Handle resume file (same logic as original form)
      let resumeFile: File | null = form.resume_file ?? null;
      if (!resumeFile && form.resume_url) {
        const filename = form.resume_url.split('/').pop() || 'resume.pdf';
        resumeFile = await urlToFile(form.resume_url, filename);
      }
      if (!resumeFile) {
        setFormError('Resume is required.');
        return;
      }
      formData.append('resume_file', resumeFile);

      // Handle profile image (same logic as original form)
      let profileImageFile: File | null = form.profile_image ?? null;
      if (!profileImageFile && form.profile_image_url) {
        const filename = form.profile_image_url.split('/').pop() || 'profile.jpg';
        profileImageFile = await urlToFile(form.profile_image_url, filename);
      }
      if (!profileImageFile) {
        setFormError('Profile image is required.');
        return;
      }
      formData.append('profile_image', profileImageFile);

      let transcriptFile: File | null = form.transcript_file ?? null;
      if (!transcriptFile && form.transcript_url) {
        const filename = form.transcript_url.split('/').pop() || 'transcript.pdf';
        transcriptFile = await urlToFile(form.transcript_url, filename);
      }
      if (!transcriptFile) {
        setFormError('Transcript is required.');
        return;
      }
      formData.append('transcript_file', transcriptFile);

      formData.append('applied', 'true');

      // Make request (same as original form)
      const response = await fetch('/api/post_profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${props.access_token}`,
        },
        body: formData,
      });

      if (response.ok) {
        // Profile saved successfully, move to step 2
        updateStep(2)
        await loadCompanies()
      } else {
        setFormError('Update failed, check your fields!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setFormError('An unexpected error occurred.');
    } finally {
      setLoading(false)
    }
  }




  return (
    <div>
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <button 
            onClick={() => updateStep(0)}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${
              currentStep >= 0 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            0
          </button>
          <div className={`h-1 w-16 ${currentStep >= 1 ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
          <button 
            onClick={() => updateStep(1)}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${
              currentStep >= 1 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            1
          </button>
          <div className={`h-1 w-16 ${currentStep >= 2 ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
          <button 
            onClick={() => {
              updateStep(2)
              if (companies.length === 0) {
                loadCompanies()
              }
            }}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${
              currentStep >= 2 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            2
          </button>

        </div>
      </div>

      {currentStep === 0 && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2 flex items-center justify-center gap-3">
              thanks for your interest
              <span className="inline-block px-3 py-1 text-sm font-bold text-white bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-lg animate-pulse">
                BETA
              </span>
            </h2>
            <p className="text-neutral-600">we just need some additional information to process your application to be a part of our beta launch </p>
          </div>

          <div className="space-y-6 mx-12 md:mx-24 lg:mx-32">
            <div className="bg-gradient-to-r from-yellow-50 via-pink-50 to-blue-50 border border-neutral-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-neutral-800 mb-4">the steps: </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    <h4 className="text-lg font-bold text-neutral-700">basic profile information</h4>
                    <p className="text-lg text-neutral-600">share some basics about yourself and introduce yourself to us </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    <h4 className="text-lg font-bold text-neutral-700">index on your interests</h4>
                    <p className="text-lg text-neutral-600">browse a set of ten partner companies and bookmark ones that particularly interest you so that we get a better understanding of your interests</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <div>
                    <h4 className="text-lg font-bold text-neutral-700">wait to hear back from us</h4>
                    <p className="text-lg text-neutral-600">with the information you provide, we will review your profile and see if there is a mutual fit for you to be a part of The Niche. <strong>we send your profile to a select cohort of startup partners and if there is a majority interest in your profile, we accept you onto the platform. </strong> the process takes 2-3 days and we will email you of your status!
                    <br /><br />
                    if you are not accepted, you can still continue to access our newsletter and persue our partner companies! once accepted, partner startups will reach out to you if your profile fits their needs and you are also welcome to connect directly with them!</p>
                  </div>
                </div>
              </div>
            </div>


            <div className="flex justify-end">
              <Button 
                onClick={() => updateStep(1)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-2"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">basic information</h2>
            <p className="text-neutral-600">tell us about yourself to get started</p>
          </div>

          <form onSubmit={handleStep1Submit} className="space-y-6">
            <ProfileInfo form={form} setForm={setForm} />
            
            {formError && (
              <Alert className="border-red-200 bg-red-50">
                <Terminal className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">{formError}</AlertTitle>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button 
                onClick={() => updateStep(0)}
                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-900 px-8 py-2"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-2"
              >
                {loading ? 'Saving...' : 'Next'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">index on your interests</h2>
            <p className="text-neutral-600"><strong>bookmark</strong> a couple companies in this list that particularly interest you so that we get a better understanding of your interests</p>
          </div>

          <div className="space-y-4">
            {loadingCompanies ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
                <p className="mt-2 text-neutral-600">Loading companies...</p>
              </div>
            ) : (
              <>
                {companies.length > 0 ? (
                  <CompanyCards companies={companies} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-600">No companies available at the moment.</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-between items-center mt-8">
            <Button 
              onClick={() => updateStep(1)}
              className="bg-neutral-200 hover:bg-neutral-300 text-neutral-900 px-8 py-2"
            >
              Back
            </Button>
            <Button 
              onClick={handleFinishSetup}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-2"
            >
              Finish Setup
            </Button>
          </div>
        </div>
      )}

      {/* Application Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-5xl w-full p-8 max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-semibold">
              Application Received
            </DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Hi {form.first_name}! Your application to The Niche has been submitted. If you are simply resubmitting your profile, feel free to ignore this email.
              We will review your profile and notify you within 1-2 weeks. In the meantime, feel free to explore our partner companies and bookmark the ones you&apos;re interested in so we can expedite your interest if you are accepted as part of the cohort!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-4">
            <p className="text-sm text-neutral-600">
              Click below to view the external profile we send to our partner companies based on the information you submitted!
            </p>
            <Button 
              onClick={handleConfirmationClose}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 text-sm w-auto"
            >
              External Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
