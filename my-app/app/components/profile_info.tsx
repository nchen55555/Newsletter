'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProfileFormState } from '@/app/types'
import ProfileAvatar from './profile_avatar'
import { useState, useRef, useEffect } from 'react'

export default function ProfileInfo({
  form,
  setForm,
}: {
  form: ProfileFormState,
  setForm: React.Dispatch<React.SetStateAction<ProfileFormState>>
}) {

  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false)
  const [filteredSchools, setFilteredSchools] = useState<string[]>([])
  const schoolInputRef = useRef<HTMLInputElement>(null)
  
  const schools = [
    'MIT',
    'Harvard',
    'Georgia Tech',
    'Stanford', 
    'Waterloo',
    'UIUC',
    'University of Michigan',
    'UT Austin',
    'Yale'
  ]

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSchoolChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setForm({ ...form, school: value })
    
    if (value.length > 0) {
      const filtered = schools.filter(school => 
        school.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredSchools(filtered)
      setShowSchoolSuggestions(filtered.length > 0)
    } else {
      setShowSchoolSuggestions(false)
    }
  }

  function selectSchool(school: string) {
    setForm({ ...form, school })
    setShowSchoolSuggestions(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (schoolInputRef.current && !schoolInputRef.current.contains(event.target as Node)) {
        setShowSchoolSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="grid lg:grid-cols-3 gap-12">
      {/* Left side - Sticky Profile Picture */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <div className="space-y-6 px-4">
          <div className="flex justify-center items-center min-h-screen lg:min-h-0">
            <div className="text-center">
              <ProfileAvatar
                name={`${form.first_name || ''} ${form.last_name || ''}`.trim() || form.email || 'User'}
                imageUrl={form.profile_image_url || undefined}
                size={250}
                editable
                onSelectFile={(file) => {
                  if (file && file.size > 2 * 1024 * 1024) { // 2MB limit for images
                    alert('Profile image size must be less than 2MB');
                    return;
                  }
                  setForm(f => ({ ...f, profile_image: file || null }));
                }}
                className="w-80 h-80 rounded-lg"
              />
              <p className="text-sm text-gray-500 mt-2">Max 2MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form Fields */}
      <div className="lg:col-span-2 flex flex-col gap-0">
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
        <div className="py-6 relative" ref={schoolInputRef}>
          <Label htmlFor="school" className="text-base font-medium">School *</Label>
          <Input 
            id="school" 
            name="school" 
            value={form.school} 
            onChange={handleSchoolChange} 
            required 
            className="h-12 text-lg px-4 mt-2"
            placeholder="Start typing to search schools..."
            autoComplete="off"
          />
          {showSchoolSuggestions && filteredSchools.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
              {filteredSchools.map((school, index) => (
                <div
                  key={index}
                  onClick={() => selectSchool(school)}
                  className="px-4 py-2 hover:bg-neutral-50 cursor-pointer text-lg border-b border-neutral-100 last:border-b-0"
                >
                  {school}
                </div>
              ))}
            </div>
          )}
        </div>
        <hr />
        <div className="py-6">
        <Label htmlFor="bio" className="text-base font-medium">Bio *</Label>
        <textarea
          id="bio"
          name="bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="I currently lead product at OpenMind, a Series A startup building out software to help robots learn from each other and operate in the real world. Prior to that, I launched Databrick's Agent Framework..."
          className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-lg 
                    mt-2 min-h-[120px] max-h-[50vh] resize-y 
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
                    focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <hr />
       {/* Interests */}
       <div className="py-6">
          <Label htmlFor="interests" className="text-base font-medium">Interests</Label>
          <textarea
            id="interests"
            name="interests"
            value={form.interests || ""}
            onChange={(e) => setForm({ ...form, interests: e.target.value })}
            placeholder="Tell us what types of roles, technologies, or problems you’re most excited about."
            className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-lg 
                      mt-2 min-h-[100px] max-h-[40vh] resize-y 
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
                      focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <hr />
      <div className="py-6">
        <Label htmlFor="phone_number" className="text-base font-medium">Phone Number *</Label>
        <Input
          id="phone_number"
          name="phone_number"
          type="tel"
          value={form.phone_number}
          onChange={handleChange}
          required
          placeholder="e.g. 555-123-4567"
          className="h-12 text-lg px-4 mt-2"
        />
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
          <Label htmlFor="resume_file" className="text-base font-medium">Resume * <span className="text-sm text-gray-500 font-normal">(Max 5MB)</span></Label>
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
        <div className="py-6 grid w-full max-w-sm items-center gap-3">
          <Label htmlFor="transcript_file" className="text-base font-medium">Transcript * <span className="text-sm text-gray-500 font-normal">(Max 5MB)</span></Label>
          <Input
            id="transcript_file"
            name="transcript_file"
            type="file"
            accept="application/pdf,.pdf,.doc,.docx"
            onChange={e => {
              const file = e.target.files && e.target.files[0];
              if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Transcript file size must be less than 5MB');
                e.target.value = '';
                return;
              }
              setForm(f => ({ ...f, transcript_file: file || null }));
            }}
            className="block w-full text-lg mt-2"
          />
          {form.transcript_file && (
            <div className="mt-2 text-sm text-gray-700">Selected: {form.transcript_file.name}</div>
          )}
          {!form.transcript_file && form.transcript_url && (
            <div className="mt-2 text-sm text-gray-700">
              Current transcript: <a href={form.transcript_url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">View uploaded transcript</a>
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

        {/* GitHub URL */}
        <div className="py-6">
          <Label htmlFor="github_url" className="text-base font-medium">GitHub URL</Label>
          <Input
            id="github_url"
            name="github_url"
            type="url"
            value={form.github_url || ""}
            onChange={handleChange}
            placeholder="https://github.com/username"
            className="h-12 text-lg px-4 mt-2"
          />
        </div>
        <hr />
        
        {/* Public Profile Toggle */}
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="is_public_profile" className="text-base font-medium">Make Profile Public</Label>
              <p className="text-sm text-gray-600 mt-1">Allow your profile to be visible to partner companies that want to reach out to you and parts of your profile (LinkedIn, Bio, and Interests) to be seem by other students on The Niche</p>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="is_public_profile"
                  checked={form.is_public_profile}
                  onChange={(e) => setForm({ ...form, is_public_profile: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        <hr />
        
        {/* Newsletter Opt-in Toggle */}
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="newsletter_opt_in" className="text-base font-medium">Newsletter Notifications</Label>
              <p className="text-sm text-gray-600 mt-1">Receive emails for new company profiles that come out on our feed</p>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="newsletter_opt_in"
                  checked={form.newsletter_opt_in}
                  onChange={(e) => setForm({ ...form, newsletter_opt_in: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        <hr />
        
        {/* Visa Sponsorship Toggle */}
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="needs_visa_sponsorship" className="text-base font-medium">Requires Visa Sponsorship</Label>
              <p className="text-sm text-gray-600 mt-1">Indicate if you need visa sponsorship for employment in the US</p>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="needs_visa_sponsorship"
                  checked={form.needs_visa_sponsorship}
                  onChange={(e) => setForm({ ...form, needs_visa_sponsorship: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        <hr />
      </div>
    </div>
  )
}
