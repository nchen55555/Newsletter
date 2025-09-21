'use client'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import ProfileInfo from './profile_info'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProfileFormState, ProfileData } from '@/app/types'
import { useSubscriptionContext } from './subscription_context'
import { CompanyCard } from '@/app/companies/company-cards'
import { CompanyWithImageUrl } from '@/app/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Search, UserPlus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ProfileAvatar from './profile_avatar'

interface MultiStepProfileFormProps extends ProfileData {
  access_token: string,
}

interface Step4FormState {
  interests: string | undefined;
  opportunities_looking_for: string | undefined;
  knownCohortMembers: {id: string, first_name: string, last_name: string, email: string}[];
  networkRecommendations: { name: string; email: string; connection: string }[];
}

// Company Carousel Component
function CompanyCarousel({ companies }: { companies: CompanyWithImageUrl[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const totalPages = companies.length

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const currentCompany = companies[currentIndex]

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="overflow-hidden rounded-lg">
        <CompanyCard disableProfile={true} key={currentCompany._id} company={currentCompany} potential={currentCompany.pending_partner} external={!currentCompany.partner}/>
      </div>

      {/* Navigation Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevSlide}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 10) }).map((_, index) => {
              const pageIndex = totalPages > 10 ? 
                Math.max(0, Math.min(currentIndex - 5, totalPages - 10)) + index :
                index;
              return (
                <button
                  key={pageIndex}
                  onClick={() => setCurrentIndex(pageIndex)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    pageIndex === currentIndex ? 'bg-neutral-900' : 'bg-neutral-300'
                  }`}
                />
              );
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={nextSlide}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Progress indicator */}
      <div className="text-center mt-4 text-sm text-neutral-600">
        Company {currentIndex + 1} of {companies.length}
      </div>
    </div>
  )
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

  
  // Step 3 form state (people connections)
  const [searchQuery, setSearchQuery] = useState('')
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([])
  const [currentUserData, setCurrentUserData] = useState<ProfileData | null>(null)
  
  // Verification dialog state
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationPhone, setVerificationPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error' | 'invalid'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  
  // Step 4 form state (interests and network)
  const [step4Form, setStep4Form] = useState<Step4FormState>({
    interests: props.interests,
    opportunities_looking_for: props.opportunities_looking_for,
    knownCohortMembers: [],
    networkRecommendations: [
      { name: '', email: '', connection: ''},
      { name: '', email: '', connection: ''},
    ]
  })


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
      if (step >= 0 && step <= 4) {
        setCurrentStep(step);
        // Load companies if navigating directly to step 2
        if (step === 2 && companies.length === 0) {
          loadCompanies();
        }
        // Load profiles if navigating directly to step 3
        if (step === 3 && allProfiles.length === 0) {
          loadAllProfiles();
        }
      }
    }
  }, [searchParams, companies.length, allProfiles.length]);

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
        
        // Filter to show only partners and pending partners, randomly select 5
        const filteredCompanies = companies.filter((company: CompanyWithImageUrl) => company.partner || company.pending_partner)
        const shuffled = filteredCompanies.sort(() => Math.random() - 0.5)
        setCompanies(shuffled.slice(0, 5))
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  // Load all profiles and current user data (same as /people/ page)
  const loadAllProfiles = async () => {
    try {
      const [profilesResponse, userResponse] = await Promise.all([
        fetch('/api/get_cohort', { credentials: 'include' }),
        fetch('/api/get_profile', { credentials: 'include' })
      ])
      
      if (profilesResponse.ok) {
        const data = await profilesResponse.json()
        setAllProfiles(data.profiles || [])
      } else {
        console.error('Failed to load profiles')
        setAllProfiles([])
      }

      if (userResponse.ok) {
        const userData = await userResponse.json()
        setCurrentUserData(userData)
      } else {
        console.error('Failed to load user data')
        setCurrentUserData(null)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setAllProfiles([])
      setCurrentUserData(null)
    } 
  }

  // Get connection status between current user and another profile (same logic as /people/ page)
  const getConnectionStatus = (profile: ProfileData) => {
    if (!currentUserData) return 'none'
    
    // Check if they are in user's verified connections (mutual connection exists)
    if (currentUserData.connections?.includes(profile.id)) {
      return 'connected'
    }
    
    // Check if user has sent a pending request to them
    if (currentUserData.pending_connections?.includes(profile.id)) {
      return 'pending_sent'
    }
    
    // Check if they have sent a pending request to user
    if (profile.pending_connections?.includes(currentUserData.id)) {
      return 'pending_received'
    }
    
    return 'none'
  }

  // Filter profiles based on search query (same logic as /people/ page)
  const searchResults = allProfiles.filter(profile => {
    const hasNames = profile.first_name && 
                    profile.last_name && 
                    profile.first_name.trim() !== '' && 
                    profile.last_name.trim() !== '';
    
    if (!hasNames || !searchQuery.trim()) return false; // Only show results when searching
    
    const fullName = `${profile.first_name} ${profile.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query);
  }).slice(0, 8) // Limit to 8 results like the people page


  // Handle dialog change
  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      // Reset form and status when dialog closes
      setVerificationEmail('')
      setVerificationPhone('')
      setVerificationStatus('idle')
      setStatusMessage('')
      setSelectedProfile(null)
    }
  }

  // Handle network verification
  const handleNetworkVerification = async () => {
    if (!selectedProfile) return
    
    if (!verificationEmail && !verificationPhone) {
      setVerificationStatus('invalid')
      setStatusMessage('Please provide either an email or phone number to verify your connection.')
      return
    }

    setIsSubmitting(true)
    setVerificationStatus('idle')
    
    try {
      const isVerified = verificationEmail === selectedProfile.email || verificationPhone === selectedProfile.phone_number
      
      if (isVerified) {
        const response = await fetch('/api/post_connect', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({connect_id: selectedProfile.id})
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.type === 'mutual') {
            setVerificationStatus('success')
            setStatusMessage(`You are now connected with ${selectedProfile.first_name}! The connection was mutual.`)
          } else {
            setVerificationStatus('success')
            setStatusMessage(`Connection request sent to ${selectedProfile.first_name}! They've received a notification.`)
          }
          // Update current user data to reflect new connection
          if (result.type === 'mutual') {
            // Mutual connection - update connections
            setCurrentUserData((prev: ProfileData | null) => 
              prev ? {
                ...prev,
                connections: [...(prev.connections || []), selectedProfile.id]
              } : null
            )
          } else {
            // Pending connection - update pending_connections
            setCurrentUserData((prev: ProfileData | null) => 
              prev ? {
                ...prev,
                pending_connections: [...(prev.pending_connections || []), selectedProfile.id]
              } : null
            )
          }
          setVerificationEmail('')
          setVerificationPhone('')
          setDialogOpen(false)
        } else {
          setVerificationStatus('error')
          setStatusMessage('Failed to send verification request. Please try again.')
        }
      } else {
        setVerificationStatus('invalid')
        setStatusMessage('Request not verified. Wrong email or phone number.')
      }
    } catch (error) {
      console.error('Network verification failed:', error)
      setVerificationStatus('error')
      setStatusMessage('Failed to send verification request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle opening connect dialog
  const handleConnectClick = (profile: ProfileData) => {
    setSelectedProfile(profile)
    setDialogOpen(true)
  }

  const handleFinishSetup = async () => {
    setLoading(true);
    if (!step4Form.interests) {
        setFormError("Keywords that describe what you are interested in are required.");
        setLoading(false);
        return;
      }

    if (!step4Form.opportunities_looking_for) {
      setFormError("What kinds of opportunities you are interested/looking for is required");
      setLoading(false);
      return;
    }
    // Check if networkRecommendations have actual content
    const hasValidNetworkRecommendations = step4Form.networkRecommendations.some((rec: { name: string; email: string; connection: string }) => 
      rec.name.trim() !== '' && rec.email.trim() !== '' && rec.connection.trim() !== ''
    );
    if (!hasValidNetworkRecommendations) {
      setFormError("At least one complete network recommendation (name, email, and connection) is required.");
      setLoading(false);
      return; 
    }
    try {
      console.log(step4Form)
      // First, post step4 form data
      const step4Response = await fetch('/api/post_step3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(step4Form)
      });

      if (step4Response.ok) {
        console.log('Step 4 data saved successfully');
        
        // Only send welcome email if step 3 data was saved successfully
        const emailResponse = await fetch('/api/send-welcome-email', {
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

        if (emailResponse.ok) {
          console.log('Welcome email sent successfully');
          setEmailSent(true);
        } else {
          console.error('Failed to send welcome email');
          const emailError = await emailResponse.text();
          console.error('Email error details:', emailError);
          setEmailSent(false);
        }
      } else {
        console.error('Failed to save step 4 data');
        const step4Error = await step4Response.text();
        console.error('Step 4 error details:', step4Error);
        setFormError("Failed to save profile data. Please try again.");
        setLoading(false);
        return;
      }

      // // Parse resume first, then generate interest profile
      // try {
      //   const response = await fetch(`/api/gemini_format`,
      //     {
      //       method: 'POST',
      //       headers: {
      //         'Content-Type': 'application/json',
      //       },
      //       body: JSON.stringify({
      //         resume_url: props.resume_url,
      //       })
      //     }
      //   );
      //   if (response.ok) {
      //       const data = await response.json();
      //       const parsedResumeResponse = await fetch('/api/post_parsed_resume', {
      //         method: 'POST',
      //         headers: {
      //           'Content-Type': 'application/json',
      //         },
      //         body: JSON.stringify({
      //           parsed_resume_json: data.data,
      //         })
      //       })

      //       // Then generate interest profile using parsed resume
      //       const interestProfileResponse = await fetch('/api/post_generated_interest_profile', {
      //         method: 'POST',
      //         headers: {
      //           'Content-Type': 'application/json',
      //         },
      //         body: JSON.stringify({
      //           interest_companies: step3Form.interestedCompanies,
      //           interest: step4Form.interests,
      //           bio: form.bio,
      //           resume: data.data, // Use the parsed resume data directly
      //           email: form.email
      //         })
      //       });

      //       if (interestProfileResponse.ok) {
      //         console.log('Interest profile generated successfully');
      //       } else {
      //         console.error('Failed to generate interest profile');
      //       }

      //   } else {
      //       console.error('Failed to fetch parsed resume data');
      //   }
        
      
      // } catch (profileError) {
      //   console.error('Error in resume parsing or profile generation:', profileError);
      // }

    } catch (error) {
      console.error('Error in finish setup process:', error);
      setEmailSent(false);
    } finally {
      setLoading(false);
    }
    
    setShowConfirmation(true);

  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    
    // Use the hash function to encode the user ID
    window.location.href = `/profile`;
  };


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
      
      // Handle resume: use file if provided, otherwise keep existing URL
      if (form.resume_file) {
        formData.append('resume_file', form.resume_file);
      } else if (!form.resume_url) {
        setFormError('Resume is required.');
        return;
      }

      // Handle profile image: use file if provided, otherwise keep existing URL
      if (form.profile_image) {
        formData.append('profile_image', form.profile_image);
      } else if (!form.profile_image_url) {
        setFormError('Profile image is required.');
        return;
      }

      // Handle transcript: use file if provided, otherwise keep existing URL
      if (form.transcript_file) {
        formData.append('transcript_file', form.transcript_file);
      } else if (!form.transcript_url) {
        setFormError('Transcript is required.');
        return;
      }

      // Make request (same as original form)
      const response = await fetch('/api/post_profile', {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        // Profile saved successfully, move to step 2
        updateStep(2)
        await loadCompanies()
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          setFormError(errorData.error || errorData.details || 'Update failed. Please check your fields and try again.');
        } catch {
          setFormError('Update failed. Please check your fields and try again.');
        }
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
          <div 
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= 0 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            0
          </div>
          <div className={`h-1 w-16 ${currentStep >= 1 ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
          <div 
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= 1 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            1
          </div>
          <div className={`h-1 w-16 ${currentStep >= 2 ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
          <div 
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= 2 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            2
          </div>
          <div className={`h-1 w-16 ${currentStep >= 3 ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
          <div 
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= 3 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            3
          </div>
          <div className={`h-1 w-16 ${currentStep >= 4 ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
          <div 
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= 4 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            4
          </div>

        </div>
      </div>

      {currentStep === 0 && (
          <div className="max-w-6xl mx-auto px-8 py-16">
            <div className="grid lg:grid-cols-2 gap-16 items-start min-h-[70vh]">
              {/* Left side - Large headline positioned to align with middle step */}
              <div className="flex items-center" style={{ marginTop: '120px' }}>
                <h1 className="text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight">
                  Make Your Profile
                </h1>
              </div>

              {/* Right side - Numbered steps */}
              <div className="space-y-12">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-neutral-900">A</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-neutral-900">Verification</h3>
                    <p className="text-neutral-600 leading-relaxed">
                      Share with us some basic information about yourself including your resume, transcript, and projects.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-neutral-900">B</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-neutral-900">Personalization: Our Network</h3>
                    <p className="text-neutral-600 leading-relaxed">
                      In this Beta, The Niche has partnered with 8 portfolio startups to match with exceptional talent. Browse through a preview of some of these partners and indicate interest to connect and apply.  
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-neutral-900">C</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-neutral-900">Connect with People</h3>
                    <p className="text-neutral-600 leading-relaxed">
                      Search for and connect with 1-2 people on The Niche to start building your verified network.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-neutral-900">D</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-neutral-900">Personalization: Index on Your Existing Network and Interests</h3>
                    <p className="text-neutral-600 leading-relaxed">
                      Introduce opportunities in your existing portfolio that you are interested in so that we can find similar ones to connect. 
                    </p>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    onClick={() => updateStep(1)}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-3 text-lg font-medium rounded-lg"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          </div>
      )}

      {currentStep === 1 && (
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Verification: Tell Us About Yourself</h2>
          </div>

          <form onSubmit={handleStep1Submit} className="space-y-6">
            <ProfileInfo form={form} setForm={setForm} />
            
            {formError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm font-medium">{formError}</p>
              </div>
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
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Personalization: Index on Our Partners</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left side - Instructions */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <div className="space-y-6 px-4">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-neutral-900">In this public beta...</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    The Niche has partnered with 8 high-growth, high-talent density startups. Scroll through some of these profiles. 
                  </p>
                  <p className="text-neutral-600 leading-relaxed">
                    <strong>Bookmark</strong> profiles you are interested in and <strong>Connect/Express Early Interest</strong> to profiles you are strongly impressed by and would like to chat with. This helps us understand your interests to tailor and connect you with more opportunities. If you connect with a company on our platform and there is mutual interest, we will forward your profile directly to the founders. 
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Company Cards */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {loadingCompanies ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
                    <p className="mt-2 text-neutral-600">Loading companies...</p>
                  </div>
                ) : (
                  <>
                    {companies.length > 0 ? (
                      <CompanyCarousel companies={companies} />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-neutral-600">No companies available at the moment.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-12">
            <Button 
              onClick={() => updateStep(1)}
              className="bg-neutral-200 hover:bg-neutral-300 text-neutral-900 px-8 py-2"
            >
              Back
            </Button>
            <Button 
              onClick={() => {
                updateStep(3)
                if (allProfiles.length === 0) {
                  loadAllProfiles()
                }
              }}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-2"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Connect with People on The Niche</h2>
            <p className="text-neutral-600 mt-4">Search for and connect with 1-2 people to start building your verified professional network.</p>
          </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
          <Input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="pl-10 pr-4 py-2 w-full rounded-full border-neutral-200 focus:border-black focus:ring-black"
          />
        </div>

        {/* Search Results - Profile Rows */}
        {searchQuery.trim() && (
          <div className="max-w-4xl mx-auto space-y-4 mb-8">
            {searchResults.length > 0 ? (
              searchResults.map((profile) => (
                <div key={profile.id} className="bg-white border border-neutral-200 rounded-2xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <ProfileAvatar
                      name={`${profile.first_name} ${profile.last_name}`}
                      imageUrl={profile.profile_image_url || undefined}
                      size={64}
                      editable={false}
                      className="w-16 h-16 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {profile.first_name} {profile.last_name}
                      </h3>
                      {profile.bio && (
                        <p className="text-sm text-neutral-600 line-clamp-2 mt-1">
                          {profile.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {(() => {
                    const status = getConnectionStatus(profile);
                    if (status === 'connected') {
                      return (
                        <Button disabled className="inline-flex items-center gap-2 bg-green-100 text-green-800 border-green-300">
                          <UserPlus className="w-4 h-4" />
                          Connected
                        </Button>
                      );
                    } else if (status === 'pending_sent') {
                      return (
                        <Button disabled className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                          <UserPlus className="w-4 h-4" />
                          Request Sent
                        </Button>
                      );
                    } else {
                      return (
                        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
                          <DialogTrigger asChild>
                            {status === 'pending_received' ? (
                              <Button className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200" onClick={() => handleConnectClick(profile)}>
                                <UserPlus className="w-4 h-4" />
                                Accept Request
                              </Button>
                            ) : (
                              <Button className="inline-flex items-center gap-2" onClick={() => handleConnectClick(profile)}>
                                <UserPlus className="w-4 h-4" />
                                Add To Network
                              </Button>
                            )}
                          </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {getConnectionStatus(profile) === 'pending_received' 
                              ? `Accept Connection Request from ${profile.first_name}`
                              : `Verify Connection with ${profile.first_name}`
                            }
                          </DialogTitle>
                          <DialogDescription>
                            {getConnectionStatus(profile) === 'pending_received'
                              ? `${profile.first_name} has sent you a connection request. Please verify their email and/or phone number to accept and add them to your network.`
                              : `To add ${profile.first_name} to your verified network, please provide their email and/or phone number. We'll confirm your connection to maintain network quality.`
                            }
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 mt-6">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder={"sam@gmail.com"}
                              value={verificationEmail}
                              onChange={(e) => setVerificationEmail(e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>
                          <p>or...</p>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="5551234567"
                              value={verificationPhone}
                              onChange={(e) => setVerificationPhone(e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>
                          
                          {/* Status Message Display */}
                          {verificationStatus !== 'idle' && (
                            <div className={`mt-6 p-4 rounded-lg text-sm ${
                              verificationStatus === 'success' 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : verificationStatus === 'error'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            }`}>
                              {statusMessage}
                            </div>
                          )}
                          
                          <div className="flex justify-end gap-2 mt-8">
                            <DialogTrigger asChild>
                              <Button variant="outline" disabled={isSubmitting}>
                                Cancel
                              </Button>
                            </DialogTrigger>
                            <Button 
                              onClick={handleNetworkVerification}
                              disabled={isSubmitting || (!verificationEmail && !verificationPhone)}
                            >
                              {isSubmitting 
                                ? "Verifying..." 
                                : selectedProfile && getConnectionStatus(selectedProfile) === 'pending_received' 
                                  ? "Accept Request" 
                                  : "Send Verification"
                              }
                            </Button>
                          </div>
                        </div>
                        </DialogContent>
                        </Dialog>
                      );
                    }
                  })()}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-600">
                No people found matching 
              </div>
            )}
          </div>
        )}

          {/* Verification Dialog */}
          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Verify Connection with {selectedProfile?.first_name}
                </DialogTitle>
                <DialogDescription>
                  To add {selectedProfile?.first_name} to your verified network, please provide their email and/or phone number. We&apos;ll confirm your connection to maintain network quality.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="sam@gmail.com"
                    value={verificationEmail}
                    onChange={(e) => setVerificationEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <p>or...</p>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="5551234567"
                    value={verificationPhone}
                    onChange={(e) => setVerificationPhone(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                {/* Status Message Display */}
                {verificationStatus !== 'idle' && (
                  <div className={`mt-6 p-4 rounded-lg text-sm ${
                    verificationStatus === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : verificationStatus === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  }`}>
                    {statusMessage}
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-8">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleNetworkVerification}
                    disabled={isSubmitting || (!verificationEmail && !verificationPhone)}
                  >
                    {isSubmitting ? "Verifying..." : "Send Verification"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex justify-between items-center mt-12">
            <Button 
              onClick={() => updateStep(2)}
              className="bg-neutral-200 hover:bg-neutral-300 text-neutral-900 px-8 py-2"
            >
              Back
            </Button>
            <Button 
              onClick={() => updateStep(4)}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-2"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Personalization: Index on Your Network and Existing Interests</h2>
          </div>

          {/* {formError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-medium">{formError}</p>
            </div>
          )} */}

          <div className="flex flex-col gap-0">
            {/* Interests Section */}
            <div className="py-6">
              <label htmlFor="interests" className="text-base font-medium">Keywords that describe what you are interested in *</label>
              <textarea
                id="interests"
                value={step4Form.interests}
                onChange={(e) => setStep4Form((prev: Step4FormState) => ({ ...prev, interests: e.target.value }))}
                placeholder="Blockchain, Product Engineering, Series A-D Startups, Systems, Quant, ..."
                className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-lg 
                          mt-2 min-h-[120px] max-h-[50vh] resize-y 
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
                          focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <hr />

            <div className="py-6">
              <label htmlFor="opportunities_looking_for" className="text-base font-medium">What exactly are you looking for? What kinds of opportunities (roles, programs, fellowships) interest you? *</label>
              <textarea
                id="opportunities_looking_for"
                value={step4Form.opportunities_looking_for}
                onChange={(e) => setStep4Form((prev: Step4FormState) => ({ ...prev, opportunities_looking_for: e.target.value }))}
                placeholder="I'm extremely interested in startups ranging from Seed to Series B that are operating within the FinTech environment. I'm interested in VC and would love to be a part of a VC fellowship to get more exposure into tech investing and due dilligence. "
                className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-lg 
                          mt-2 min-h-[120px] max-h-[50vh] resize-y 
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
                          focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <hr />

            {/* Network Recommendations Section */}
            <div className="py-6">
              <label className="text-base font-medium">Build Out Your Network on The Niche</label>
              <p className="text-sm text-neutral-600 mt-1 mb-4">Bring in 2-3 people to The Niche.</p>
              <div className="space-y-4">
                {step4Form.networkRecommendations.map((rec, index) => (
                  <div key={index} className="border border-input rounded-md p-6 bg-background">
                    <h4 className="text-base font-medium text-neutral-800 mb-4">Person {index + 1}</h4>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`rec-name-${index}`} className="block text-sm font-medium text-neutral-700 mb-2">
                          Name *
                        </label>
                        <input
                          id={`rec-name-${index}`}
                          type="text"
                          value={rec.name}
                          onChange={(e) => {
                            const newRecs = [...step4Form.networkRecommendations]
                            newRecs[index] = { ...newRecs[index], name: e.target.value }
                            setStep4Form((prev: Step4FormState) => ({ ...prev, networkRecommendations: newRecs }))
                          }}
                          placeholder="Full name"
                          className="h-12 text-lg px-4 w-full rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div>
                        <label htmlFor={`rec-email-${index}`} className="block text-sm font-medium text-neutral-700 mb-2">
                          Email *
                        </label>
                        <input
                          id={`rec-email-${index}`}
                          type="email"
                          value={rec.email}
                          onChange={(e) => {
                            const newRecs = [...step4Form.networkRecommendations]
                            newRecs[index] = { ...newRecs[index], email: e.target.value }
                            setStep4Form((prev: Step4FormState) => ({ ...prev, networkRecommendations: newRecs }))
                          }}
                          placeholder="email@example.com"
                          className="h-12 text-lg px-4 w-full rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div>
                        <label htmlFor={`rec-email-${index}`} className="block text-sm font-medium text-neutral-700 mb-2">
                          How Do You Know This Person? *
                        </label>
                        <input
                          id={`rec-connection-${index}`}
                          type="connection"
                          value={rec.connection}
                          onChange={(e) => {
                            const newRecs = [...step4Form.networkRecommendations]
                            newRecs[index] = { ...newRecs[index], connection: e.target.value }
                            setStep4Form((prev: Step4FormState) => ({ ...prev, networkRecommendations: newRecs }))
                          }}
                          placeholder="Interned together at xAI..."
                          className="h-12 text-lg px-4 w-full rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <hr />
          </div>

          {formError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-medium">{formError}</p>
            </div>
          )}

          <div className="flex justify-between items-center mt-12">
            <Button 
              onClick={() => updateStep(3)}
              className="bg-neutral-200 hover:bg-neutral-300 text-neutral-900 px-8 py-2"
            >
              Back
            </Button>
            <Button 
              onClick={handleFinishSetup}
              disabled={loading}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-2"
            >
              {loading ? 'Finishing Setup...' : 'Finish Setup'}
            </Button>
          </div>
        </div>
      )}

      {/* Application Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-5xl w-full p-8 max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-semibold">
              Profile Created
            </DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Hi {form.first_name}! 
              <br></br><br></br>
              <strong>Congratulations for creating your profile with The Niche!</strong> It takes about 2-3 days for us to verify your identity, analyze your profile, and recommend opportunities indexed to your skillsets and interests. We will send you an email when your profile is ready for you. 
              <br></br>
              <br></br>
              In the meantime, you can start exploring our platform, using the application tracker, and connecting with others on the platform. 
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-4">
            <p className="text-sm text-neutral-600">
              Click below to view your external profile.
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
