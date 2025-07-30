'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2Icon, Terminal } from 'lucide-react'
import { useState } from 'react'

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
}: {
  id: number,
  email: string,
  first_name: string,
  last_name: string,
  linkedin_url: string,
  resume_url: string,
  personal_website: string,
  phone_number: string,
  access_token: string
}) {
type ProfileFormState = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  linkedin_url: string;
  resume_url: string;
  personal_website: string;
  phone_number: string;
  resume_file?: File | null;
};

const [form, setForm] = useState<ProfileFormState>({
  id: id,
  email: email,
  first_name: first_name || "",
  last_name: last_name || "",
  linkedin_url: linkedin_url || "",
  resume_url: resume_url || "",
  personal_website: personal_website || "",
  phone_number: phone_number || "",
  resume_file: null,
});

  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function urlToFile(url: string, filename: string, mimeType?: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType || blob.type });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(false)

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

    const formData = new FormData();
    formData.append('id', form.id.toString());
    formData.append('first_name', form.first_name);
    formData.append('last_name', form.last_name);
    formData.append('linkedin_url', form.linkedin_url);
    formData.append('personal_website', form.personal_website);
    formData.append('phone_number', form.phone_number);
    formData.append('email', form.email)
    
    let resumeFile: File | null = form.resume_file ?? null;

    // If no new file, but we have a resume_url, fetch and convert to File
    if (!resumeFile && form.resume_url) {
      const filename = form.resume_url.split('/').pop() || 'resume.pdf';
      resumeFile = await urlToFile(form.resume_url, filename);
    }
    if (!resumeFile) {
      setFormError('Resume is required.');
      return;
    }

    formData.append('resume_file', resumeFile);

    // TODO: PATCH to /api/profile
    const res = await fetch('/api/post_profile', { method: 'PATCH',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
        body: formData })
    if (res.ok) {
        setFormSuccess(true)
    }else {
        setFormError("Update failed")
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold">Your Profile</h2>
        <p className="text-lg mt-2 text-gray-600">
          Fill out your information. <strong>Each intro/application to our partner companies will require the information below.</strong> Your email is verified and cannot be changed.
        </p>
      </div>
      <div className="bg-white rounded-2xl shadow-md border border-neutral-200 px-8 py-10">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex flex-col gap-0">
              <div className="py-6">
                <Label htmlFor="first_name" className="text-base font-medium">First Name *</Label>
                <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} required className="h-12 text-lg px-4 mt-2" />
              </div>
              <hr />
              <div className="py-6">
                <Label htmlFor="last_name" className="text-base font-medium">Last Name *</Label>
                <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} required className="h-12 text-lg px-4 mt-2" />
              </div>
              <hr />
              <div className="py-6">
                <Label htmlFor="phone_number" className="text-base font-medium">Phone Number *</Label>
                <Input id="phone_number" name="phone_number" type="tel" value={form.phone_number} onChange={handleChange} required placeholder="e.g. 555-123-4567" className="h-12 text-lg px-4 mt-2" />
              </div>
              <hr />
              <div className="py-6">
                <Label htmlFor="email" className="text-base font-medium">Email (verified)</Label>
                <Input id="email" name="email" value={form.email} readOnly className="h-12 text-lg px-4 bg-gray-100 mt-2" />
              </div>
              <hr />
              <div className="py-6">
                <Label htmlFor="linkedin_url" className="text-base font-medium">LinkedIn URL *</Label>
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  value={form.linkedin_url}
                  onChange={handleChange}
                  placeholder="https://www.linkedin.com/in/..."
                  className="h-12 text-lg px-4 mt-2"
                />
              </div>
              <hr />
              <div className="py-6 grid w-full max-w-sm items-center gap-3">                
                <Label htmlFor="resume_file" className="text-base font-medium">Resume *</Label>
                <Input
                  id="resume_file"
                  name="resume_file"
                  type="file"
                  accept="application/pdf,.pdf,.doc,.docx"
                  onChange={e => {
                    const file = e.target.files && e.target.files[0];
                    setForm(f => ({ ...f, resume_file: file || null }));
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
              <hr />
              <div className="py-6">
                <Label htmlFor="personal_website" className="text-base font-medium">Personal Website</Label>
                <Input
                  id="personal_website"
                  name="personal_website"
                  type="url"
                  value={form.personal_website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                  className="h-12 text-lg px-4 mt-2"
                />
              </div>
              <hr />
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
              <Button type="submit" className="h-12 px-8 text-lg">Save Changes</Button>
            </div>
          </form>
      </div>
    </div>
  )
}