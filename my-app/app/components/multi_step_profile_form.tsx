'use client'
import { useState, useEffect } from 'react'
import ProfileInfoChatbot from './profile_info_chatbot'
import { useRouter} from 'next/navigation'
import { ProfileFormState, ProfileData} from '@/app/types'
import { useSubscriptionContext } from './subscription_context'
import { Container } from './container'

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
        setEmailSent(true);
      } else {
        setEmailSent(false);
      }
      

    } catch (error) {
      console.error('Error in finish setup process:', error);
      setEmailSent(false);
    } 
    
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
      // if (!form.school) {
      //   setFormError("School is required.");
      //   return;
      // }

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
      // if (form.transcript_file) {
      //   formData.append('transcript_file', form.transcript_file);
      // } else if (!form.transcript_url) {
      //   setFormError('Transcript is required.');
      //   return;
      // }

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
        // Update local state to reflect applied status
        setForm(prev => ({ ...prev, applied: true }));
        handleFinishSetup();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setFormError(`Failed to update profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      setFormError(`An unexpected error occurred. ${error}`);
    } 
  }




  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
        {/* <Navigation /> */}
        <div className="px-6 relative">
          <div className="absolute inset-0 pointer-events-none"></div>
          <Container className="max-w-4xl mx-auto">
            <div className="max-w-6xl mx-auto px-8 py-16">
            <ProfileInfoChatbot 
              form={form} 
              setForm={setForm} 
              onComplete={(isComplete) => {
                if (isComplete) {
                  // Automatically submit when chatbot flow completes
                  handleStep1Submit({ preventDefault: () => {} } as React.FormEvent);
                }
              }}
              initialStep={props.onboarding_step}
            />

            {formError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm font-medium">{formError}</p>
              </div>
            )}
          </div>
          </Container>
        </div>
      </div>
  )
}
