'use client'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import ProfileInfoChatbot from './profile_info_chatbot'
import { useRouter} from 'next/navigation'
import { ProfileFormState, ProfileData} from '@/app/types'
import { useSubscriptionContext } from './subscription_context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog"
import { FileText, Heart, Users, Handshake, MousePointer } from 'lucide-react'

interface MultiStepProfileFormProps extends ProfileData {
  access_token: string,
}


export default function MultiStepProfileForm(props: MultiStepProfileFormProps) {
  const router = useRouter();
  const { isSubscribed, loading } = useSubscriptionContext()
  const [, setEmailSent] = useState(false)

  



  useEffect(() => {
    if (!loading && !isSubscribed) {
      router.push("/"); 
    }
  }, [isSubscribed, loading, router]);


  const [form, setForm] = useState<ProfileFormState>({
    id: props.id,
    email: props.email,
    first_name: props.first_name || "",
    last_name: props.last_name || "",
    school: props.school || "",
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
    needs_visa_sponsorship: props.needs_visa_sponsorship || false,
    interests: props.interests || "",
    network_recommendations: props.network_recommendations || [],
  });

  const [formError, setFormError] = useState<string | null>(null)
  const [profileFormComplete, setProfileFormComplete] = useState(false)

  // Load companies for step 2 (same query as companies page, limited to 20


    const handleFinishSetup = async () => {

    try {
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
      

    } catch (error) {
      console.error('Error in finish setup process:', error);
      setEmailSent(false);
    } 
    
  };

  const handleConfirmationClose = () => {    
    // Use the hash function to encode the user ID
    window.location.href = `/people`;
  };


  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

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
      if (!form.school) {
        setFormError("School is required.");
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
      formData.append('needs_visa_sponsorship', form.needs_visa_sponsorship.toString());
      formData.append('applied', 'true');
      formData.append('school', form.school);
      
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

      // Add new ProfileInfoChatbot fields
      if (form.interests) {
        formData.append('interests', form.interests);
      }
      
      if (form.network_recommendations && form.network_recommendations.length > 0) {
        formData.append('network_recommendations', JSON.stringify(form.network_recommendations));
      }

      formData.append('applied', 'true')

      // Make request (same as original form)
      const response = await fetch('/api/post_profile', {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Profile update successful:', result);
        handleFinishSetup();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Profile update failed:', response.status, errorData);
        setFormError(`Failed to update profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setFormError('An unexpected error occurred.');
    } 
  }




  return (
    <div>
    <div className="max-w-6xl mx-auto px-8 py-16">
    <ProfileInfoChatbot 
      form={form} 
      setForm={setForm} 
      onComplete={(isComplete) => {
        setProfileFormComplete(isComplete);
        if (isComplete) {
          // Automatically submit when chatbot flow completes
          handleStep1Submit({ preventDefault: () => {} } as React.FormEvent);
        }
      }}
    />

    {formError && (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm font-medium">{formError}</p>
      </div>
    )}
  </div>

      {/* Application Confirmation Dialog */}
      <Dialog open={profileFormComplete}>
        <DialogContent className="sm:max-w-5xl w-full p-8 max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center">
            {/* <DialogTitle className="text-xl font-semibold">
              Profile Created
            </DialogTitle> */}
            <DialogDescription className="text-lg mt-2">
              Hi {form.first_name}! 
              <br></br><br></br>
              Congratulations on requesting access to The Niche! We are excited to review your profile for our private beta launch. If we believe there is mutual fit between our network of beta opportunities or if a founder reaches out to specifically connect with you, we will reach back out with an invitation to be officially a part of this network! 
              <br></br>
              <br></br>
              <strong>In the meantime, feel free to curate your professional network by connecting to your verified professional community or bringing others on to the platform, sharing your thoughts on our company articles with your network, and more! Interacting more with The Niche allows us to better understand your interests and how our network of beta opportunities might be a good fit for you. </strong>
              <br></br>
              <br></br>
              <div className="p-6 overflow-x-auto">
                    {/* Horizontal Process Flow */}
                    <div className="flex flex-row items-center justify-center gap-4 min-w-fit">
                        {/* Circular Data Flow */}
                        <div className="relative w-64 h-68">
                            {/* Center - Personalized Recommendations */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="text-center flex flex-col items-center">
                                    <div className="w-20 h-20 flex items-center justify-center mb-2">
                                        <p className="text-xs text-neutral-700 font-medium leading-tight">Personalized<br/>Recommendations</p>
                                    </div>
                                </div>
                            </div>

                            {/* Skills - Top */}
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                                <div className="text-center">
                                    <div className="w-14 h-14 flex items-center justify-center mb-2">
                                        <FileText className="w-7 h-7 text-neutral-600" />
                                    </div>
                                    <p className="text-xs text-neutral-600 font-medium">Skills</p>
                                </div>
                            </div>

                            {/* Interests - Bottom Left */}
                            <div className="absolute bottom-0 left-0">
                                <div className="text-center">
                                    <div className="w-14 h-14 flex items-center justify-center mb-2">
                                        <Heart className="w-7 h-7 text-neutral-600" />
                                    </div>
                                    <p className="text-xs text-neutral-600 font-medium">Interests</p>
                                </div>
                            </div>

                            {/* Networks - Bottom Right */}
                            <div className="absolute bottom-0 right-0">
                                <div className="text-center">
                                    <div className="w-14 h-14 flex items-center justify-center mb-2">
                                        <Users className="w-7 h-7 text-neutral-600" />
                                    </div>
                                    <p className="text-xs text-neutral-600 font-medium">Networks</p>
                                </div>
                            </div>

                            {/* Small arrows pointing to center */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 256 256">
                                <defs>
                                    <marker id="small-arrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                        <polygon points="0 0, 6 2, 0 4" fill="#a3a3a3" />
                                    </marker>
                                </defs>
                                
                                {/* Small arrow from Skills */}
                                <line
                                    x1="128" y1="80"
                                    x2="128" y2="95"
                                    stroke="#a3a3a3"
                                    strokeWidth="1"
                                    markerEnd="url(#small-arrow)"
                                />
                                
                                {/* Small arrow from Networks */}
                                <line
                                    x1="170" y1="180"
                                    x2="155" y2="155"
                                    stroke="#a3a3a3"
                                    strokeWidth="1"
                                    markerEnd="url(#small-arrow)"
                                />
                                
                                {/* Small arrow from Interests */}
                                <line
                                    x1="86" y1="180"
                                    x2="101" y2="155"
                                    stroke="#a3a3a3"
                                    strokeWidth="1"
                                    markerEnd="url(#small-arrow)"
                                />
                            </svg>
                        </div>

                        {/* Arrow 1 - from edge of circular diagram to You Connect */}
                        <div className="flex items-center">
                            <svg className="w-12 h-6" viewBox="0 0 48 24">
                                <path d="M 4 12 L 40 12" stroke="#a3a3a3" strokeWidth="2" markerEnd="url(#arrow-flow)" />
                                <defs>
                                    <marker id="arrow-flow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                        <polygon points="0 0, 8 3, 0 6" fill="#a3a3a3" />
                                    </marker>
                                </defs>
                            </svg>
                        </div>

                        {/* Connect */}
                        <div className="text-center">
                            <div className="w-16 h-16 flex items-center justify-center mb-3">
                                <MousePointer className="w-8 h-8 text-neutral-600" />
                            </div>
                            <p className="text-sm text-neutral-700 font-medium">You<br/>Connect</p>
                        </div>

                        {/* Arrow 2 - from You Connect to Direct Founder Connection */}
                        <div className="flex items-center">
                            <svg className="w-12 h-6" viewBox="0 0 48 24">
                                <path d="M 4 12 L 40 12" stroke="#a3a3a3" strokeWidth="2" markerEnd="url(#arrow-flow)" />
                                <defs>
                                    <marker id="arrow-flow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                        <polygon points="0 0, 8 3, 0 6" fill="#a3a3a3" />
                                    </marker>
                                </defs>
                            </svg>
                        </div>

                        {/* Founder Connection */}
                        <div className="text-center">
                            <div className="w-16 h-16 flex items-center justify-center mb-3">
                                <Handshake className="w-8 h-8 text-neutral-600" />
                            </div>
                            <p className="text-sm text-neutral-700 font-medium">Founder <br />Introduction</p>
                        </div>
                    </div>
                    
                    
                </div>
              We are just getting started and have a lot of exciting features and partnerships in the works. If you have any feedback or suggestions, please don&#39;t hesitate to reach out to us. 
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-4">
            <Button 
              onClick={handleConfirmationClose}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-2 text-sm w-fit"
            >
              The Network
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
