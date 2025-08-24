'use client'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import ProfileInfo from './profile_info'
import { useRouter } from 'next/navigation'
import { ProfileFormState } from '@/app/types'
import { useSubscriptionContext } from './subscription_context'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2Icon, Terminal } from 'lucide-react'

export default function ProfileForm({
  id, 
  email,
  first_name,
  last_name,
  linkedin_url,
  resume_url,
  personal_website,
  phone_number, 
  access_token,
  profile_image_url,
  bio,
  is_public_profile,
  newsletter_opt_in,
}: {
  id: number,
  email: string,
  first_name: string,
  last_name: string,
  linkedin_url: string,
  resume_url: string,
  personal_website: string,
  phone_number: string,
  access_token: string,
  profile_image_url: string,
  bio: string,
  is_public_profile?: boolean,
  newsletter_opt_in?: boolean,
}) {
  const router = useRouter();
  const { isSubscribed } = useSubscriptionContext()

  useEffect(() => {
    if (!isSubscribed) {
      router.push("/"); 
    }
  }, [isSubscribed, router]);
  
  const [form, setForm] = useState<ProfileFormState>({
    id,
    email,
    first_name: first_name || "",
    last_name: last_name || "",
    linkedin_url: linkedin_url || "",
    resume_url: resume_url || "",
    personal_website: personal_website || "",
    phone_number: phone_number || "",
    resume_file: null,
    profile_image_url: profile_image_url || null,
    profile_image: null,
    bio: bio || "",
    is_public_profile: is_public_profile || false,
    newsletter_opt_in: newsletter_opt_in || false,
  });

  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)
  const [loading, setLoading] = useState(false) // <-- new loading states

  async function urlToFile(url: string, filename: string, mimeType?: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType || blob.type });
  }

  async function handleSubmit(e: React.FormEvent) {
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
      if (!form.linkedin_url) {
        setFormError("LinkedIn URL is required.");
        return;
      }

      if (!form.bio) {
        setFormError("Bio is required.");
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
      formData.append('is_public_profile', form.is_public_profile.toString());
      formData.append('newsletter_opt_in', form.newsletter_opt_in.toString());
      
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

      let profileImageFile: File | null = form.profile_image ?? null;
      if (!profileImageFile && form.profile_image_url) {
        const filename = form.profile_image_url.split('/').pop() || 'profile.jpg';
        profileImageFile = await urlToFile(form.profile_image_url, filename);
      }
      if(!profileImageFile){
        setFormError('Profile image is required.');
        return;
      }
      formData.append('profile_image', profileImageFile);
      

      const res = await fetch('/api/post_profile', { 
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        body: formData 
      })

      if (res.ok) {
        setFormSuccess(true)
      } else {
        setFormError(`Update failed, check your fields!`)
      }
    } catch (e) {
      console.error("Failed to update profile:", e);
      setFormError('An unexpected error occurred.')
    } finally {
      setLoading(false) // stop loading
    }
  }

  return (
    <main className="flex-1 px-8 py-10">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold">Profile</h2>
          <p className="text-lg mt-2 text-gray-600">
            Fill out your information. <strong>Your profile will serve the basis of your applications to our partner companies. </strong> Your email is verified and cannot be changed.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-neutral-200 px-8 py-10">
          <form onSubmit={handleSubmit} className="w-full">
            <ProfileInfo form={form} setForm={setForm} />

            <div className="flex flex-col gap-0">
              {formSuccess && (
                <Alert className="mt-6">
                  <CheckCircle2Icon />
                  <AlertTitle>Profile updated successfully!</AlertTitle>
                </Alert>
              )}
              {formError && (
                <Alert variant="destructive" className="mt-6">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>{formError}</AlertTitle>
                </Alert>
              )}
            </div> 

            <div className="flex justify-end mt-8 gap-4">
              <Button 
                type="submit" 
                className="h-12 px-8 text-lg" 
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form> 
        </div>
      </div>
    </main>
  )
}
