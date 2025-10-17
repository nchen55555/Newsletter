'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProfileFormState, ProfileData, CompanyWithImageUrl, ConnectionData } from '@/app/types'
import ProfileAvatar from './profile_avatar'
import { useState, useRef, useEffect, useCallback } from 'react'
import { CheckCircle, Upload, Search, UserPlus, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

import { CompanyCard } from '@/app/companies/company-cards'
import ProfileCard from './profile_card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConnectionScale } from './connection-scale'

interface Question {
  id: string
  field: keyof ProfileFormState
  question: string
  type: 'text' | 'textarea' | 'file' | 'toggle' | 'url' | 'tel' | 'companies' | 'networking' | 'network_recommendations' | 'welcome'
  required: boolean
  placeholder?: string
  options?: string[]
  description?: string
}

const questions: Question[] = [
  {
    id: 'welcome',
    field: 'first_name', // Using existing field as placeholder
    question: "Welcome to The Niche!",
    description: "We are excited to get to know you better and explore if there's a mutual fit. Our goal is to introduce you directly to opportunities and founders at some of the highest growth startups while helping you curate a personalized, professional network that aligns with your interests, skillsets, and verified by your existing professional community. \nIf you've received a special access code, your profile has already been pre-verified. Once you complete your account setup, you'll gain access to our private beta experience.",
    type: 'welcome',
    required: true
  },
  {
    id: 'profile_image',
    field: 'profile_image',
    question: "Let's start with your profile picture",
    description: "Upload a photo to help us get to know you better",
    type: 'file',
    required: true
  },
  {
    id: 'first_name',
    field: 'first_name',
    question: "What's your first name?",
    type: 'text',
    required: true,
    placeholder: 'Your first name'
  },
  {
    id: 'last_name',
    field: 'last_name',
    question: "And your last name?",
    type: 'text',
    required: true,
    placeholder: 'Your last name'
  },
  {
    id: 'school',
    field: 'school',
    question: "Which school do you attend or did you graduate from?",
    type: 'text',
    required: true,
    placeholder: 'Start typing your school name...',
    options: ['MIT', 'Harvard', 'Brown', 'Columbia', 'Georgia Tech', 'Stanford', 'Waterloo', 'UIUC', 'University of Michigan', 'UT Austin', 'Yale']
  },
  {
    id: 'bio',
    field: 'bio',
    question: "Tell us about yourself",
    description: "Give us an introduction of who you are, what you are interested in, and what you are currently doing!",
    type: 'textarea',
    required: true,
    placeholder: 'I currently lead product at OpenMind, a Series A startup building out software to help robots learn from each other...'
  },
  {
    id: 'phone',
    field: 'phone_number',
    question: "What's the best phone number to reach you at?",
    type: 'tel',
    required: true,
    placeholder: 'e.g. 555-123-4567'
  },
  {
    id: 'linkedin',
    field: 'linkedin_url',
    question: "What's your LinkedIn profile URL?",
    type: 'url',
    required: true,
    placeholder: 'https://www.linkedin.com/in/...'
  },
  {
    id: 'resume',
    field: 'resume_file',
    question: "Please upload your resume",
    description: "PDF, DOC, or DOCX files only (max 5MB)",
    type: 'file',
    required: true
  },
  {
    id: 'transcript',
    field: 'transcript_file',
    question: "Upload your transcript",
    description: "PDF, DOC, or DOCX files only (max 5MB)",
    type: 'file',
    required: true
  },
  {
    id: 'website',
    field: 'personal_website',
    question: "Do you have a personal website?",
    description: "Optional - share if you have one",
    type: 'url',
    required: false,
    placeholder: 'https://yourwebsite.com'
  },
  {
    id: 'companies',
    field: 'bookmarked_companies', 
    question: "Explore opportunities",
    description: "The Niche works with a select cohort of high-talent density startups. We want to get a better understanding of your interests. Please bookmark companies that interest you!",
    type: 'companies',
    required: false
  },
  {
    id: 'networking',
    field: 'pending_connections_new', 
    question: "Build your verifiable professional network",
    description: "Connect with 1-2 people that you would consider part of your closest verifiable professional network. We use your connections to tailor recommendations and opportunities for you.",
    type: 'networking',
    required: true
  },
  {
    id: 'interests',
    field: 'interests',
    question: "What are your interests and areas of focus?",
    description: "Tell us about your professional interests, technical areas, or industries you're passionate about",
    type: 'textarea',
    required: true,
    placeholder: 'AI/ML, fintech, climate tech, product management, backend engineering...'
  },
  {
    id: 'network_recommendations',
    field: 'network_recommendations',
    question: "Can you recommend 2 people from your network?",
    description: "Build your professional network by recommending your 2 smartest friends",
    type: 'network_recommendations',
    required: true
  },
  {
    id: 'public_profile',
    field: 'is_public_profile',
    question: "Make your profile public?",
    description: "Allow partner companies and other students to discover you",
    type: 'toggle',
    required: true
  },
  {
    id: 'newsletter',
    field: 'newsletter_opt_in',
    question: "Stay updated with new companie profiles?",
    description: "Get an email when we cover a new company. We drop a maximum of two company profiles each week.",
    type: 'toggle',
    required: true
  },
  {
    id: 'visa',
    field: 'needs_visa_sponsorship',
    question: "Do you need visa sponsorship?",
    description: "For employment in the US",
    type: 'toggle',
    required: true
  }
]

export default function ProfileInfoChatbot({
  form,
  setForm,
  setIsVerified,
  onComplete,
}: {
  form: ProfileFormState,
  setForm: React.Dispatch<React.SetStateAction<ProfileFormState>>
  setIsVerified: React.Dispatch<React.SetStateAction<boolean>>
  onComplete?: (isComplete: boolean) => void
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [showQuestion, setShowQuestion] = useState(false)
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false)
  const [filteredSchools, setFilteredSchools] = useState<string[]>([])
  
  // Company and networking state
  const [companies, setCompanies] = useState<CompanyWithImageUrl[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialog and networking state
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error' | 'pending'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [uploadComplete, setUploadComplete] = useState<{[key: string]: boolean}>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentUserData, setCurrentUserData] = useState<ProfileData | null>(null)
  
  // Access code state
  const [accessCode, setAccessCode] = useState('')
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null)
  const [accessCodeVerified, setAccessCodeVerified] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toggleRef = useRef<HTMLDivElement>(null)
  const toggleRef2 = useRef<HTMLDivElement>(null)

  const currentQuestion = questions[currentQuestionIndex]
  const isComplete = currentQuestionIndex >= questions.length
  const hasProfileImage = form.profile_image || form.profile_image_url

  // Shared validation logic for any question
  const isQuestionValid = useCallback((question: typeof questions[0]) => {
    if (!question) return true
    if (!question.required) return true
    
    // Handle welcome question - it's valid if an access code has been submitted or verified
    if (question.type === 'welcome') {
      return accessCodeVerified || accessCode.trim() !== ''
    }
    
    const field = question.field
    const value = form[field]
    
    // Handle file upload fields
    if (field === 'resume_file' || field === 'transcript_file') {
      const urlField = field.replace('_file', '_url') as keyof ProfileFormState
      return !!value || !!form[urlField]
    }
    
    // Handle profile image field
    if (field === 'profile_image') {
      return !!form.profile_image || !!form.profile_image_url
    }

    // Handle network recommendations - need all 3 fields filled for at least one recommendation
    if (field === 'network_recommendations') {
      const recommendations = form.network_recommendations || []
      return recommendations.some(rec => 
        rec && rec.name && rec.name.trim() !== '' && 
        rec.email && rec.email.trim() !== '' && 
        rec.connection && rec.connection.trim() !== ''
      )
    }
    
    // Handle networking - need at least 1 pending connection
    if (field === 'pending_connections_new') {
      if (!currentUserData) return false
      const pendingConnections = currentUserData.pending_connections_new || []
      const connections = currentUserData.connections_new || []
      return (pendingConnections.length + connections.length) >= 1
    }
    
    // Handle toggles - need an explicit selection (not undefined)
    if (question.type === 'toggle') {
      return value !== undefined && value !== null
    }
    
    // Handle all other fields
    return !!value && value.toString().trim() !== ''
  }, [form, currentUserData, accessCodeVerified, accessCode])

  // Validation function to check if current question is satisfied
  const isCurrentQuestionValid = () => {
    return isQuestionValid(currentQuestion)
  }

  // Check if we can proceed to next question
  const canProceedToNext = () => {
    return isCurrentQuestionValid() 
  }


  // Function to post individual field updates
  const postFieldUpdate = async (field: keyof ProfileFormState, value: string | boolean | File | Array<{name: string, email: string, connection: string}> | null) => {
    try {
      const formData = new FormData()
      formData.append('id', form.id.toString())
      
      // Handle different field types
      if (field === 'profile_image' && value instanceof File) {
        formData.append('profile_image', value)
      } else if (field === 'resume_file' && value instanceof File) {
        formData.append('resume_file', value)
      } else if (field === 'transcript_file' && value instanceof File) {
        formData.append('transcript_file', value)
      } else if (field === 'network_recommendations' && Array.isArray(value)) {
        formData.append('network_recommendations', JSON.stringify(value))
      } else if (typeof value === 'boolean') {
        formData.append(field as string, value.toString())
      } else if (value !== null && value !== undefined) {
        formData.append(field as string, value.toString())
      }
      
      const response = await fetch('/api/post_profile', {
        method: 'PATCH',
        body: formData,
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`Successfully updated ${field}:`, result)
        
        // Update form with any returned URLs (for file uploads)
        if (result.profileImageUrl && field === 'profile_image') {
          setForm(prev => ({ ...prev, profile_image_url: result.profileImageUrl }))
        }
        if (result.resumeUrl && field === 'resume_file') {
          setForm(prev => ({ ...prev, resume_url: result.resumeUrl }))
        }
        if (result.transcriptUrl && field === 'transcript_file') {
          setForm(prev => ({ ...prev, transcript_url: result.transcriptUrl }))
        }
        
        return true
      } else {
        console.error(`Failed to update ${field}:`, response.status)
        return false
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
      return false
    }
  }

  // Data loading functions
  const loadCompanies = async () => {
    setLoadingCompanies(true)
    try {
      const response = await fetch('/api/companies')
      
      if (!response.ok) {
        throw new Error('Failed to fetch companies')
      }
      
      const data = await response.json()
      const filteredCompanies = data.filter((company: CompanyWithImageUrl) => company.partner || company.pending_partner)
      const shuffled = filteredCompanies.sort(() => Math.random() - 0.5)
      setCompanies(shuffled.slice(0, 10))
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  const loadAllProfiles = async () => {
    setLoadingProfiles(true)
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
    } finally {
      setLoadingProfiles(false)
    }
  }

  // Load data when reaching companies or networking questions
  useEffect(() => {
    if (currentQuestion?.type === 'companies' && companies.length === 0) {
      loadCompanies()
    }
    if (currentQuestion?.type === 'networking' && allProfiles.length === 0) {
      loadAllProfiles()
    }
  }, [currentQuestion?.type, companies.length, allProfiles.length])

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
        <CompanyCard key={currentCompany._id} company={currentCompany} potential={currentCompany.pending_partner} external={!currentCompany.partner}/>
      </div>

      {/* Navigation Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
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
            type="button"
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

  // Get connection status between current user and another profile (same logic as /people/ page)
  const getConnectionStatus = (profile?: ProfileData | null): 'connected' | 'pending_sent' | 'requested' | 'none' => {
    // If we don't have the current user OR the other profile/id, bail early.
    if (!currentUserData || !profile || !profile.id) return 'none';

    // Normalize arrays in case backend returns null/undefined
    const userConnections = Array.isArray(currentUserData.connections_new) ? currentUserData.connections_new : [];
    const userPendingConnections = Array.isArray(currentUserData.pending_connections_new) ? currentUserData.pending_connections_new : [];
    const userRequestedConnections = Array.isArray(currentUserData.requested_connections_new) ? currentUserData.requested_connections_new : [];

    // Normalize the profile id (stringify to be safe if backend mixes types)
    const pid = String(profile.id);

    const isConnected = userConnections.some((conn: ConnectionData) => String(conn.connect_id) === pid);
    if (isConnected) return 'connected';

    const isPendingSent = userPendingConnections.some((conn: ConnectionData) => String(conn.connect_id) === pid);
    if (isPendingSent) return 'pending_sent';

    const isRequested = userRequestedConnections.some((conn: ConnectionData) => String(conn.connect_id) === pid);
    if (isRequested) return 'requested';

    return 'none';
  };


  // Networking helper functions
  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      // Reset status when dialog closes
      setVerificationStatus('idle')
      setStatusMessage('')
      setSelectedProfile(null)
    }
  }

  const handleConnectClick = (profile: ProfileData) => {
    setSelectedProfile(profile)
    setDialogOpen(true)
  }

  const handleConnectionScale = async (scaleValue: number) => {
    if (!selectedProfile) return

    setIsSubmitting(true)
    setVerificationStatus('idle')
    
    try {
      const response = await fetch('/api/post_connect', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connect_id: selectedProfile.id,
          rating: scaleValue
        })
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
              connections_new: [...(prev.connections_new || []), {connect_id: selectedProfile.id, rating: scaleValue}],
              connections: [...(prev.connections || []), selectedProfile.id]
            } : null
          )
        } else {
          // Pending connection - update pending_connections
          setCurrentUserData((prev: ProfileData | null) => 
            prev ? {
              ...prev,
              pending_connections_new: [...(prev.pending_connections_new || []), {connect_id: selectedProfile.id, rating: scaleValue}],
              pending_connections: [...(prev.pending_connections || []), selectedProfile.id]
            } : null
          )
        }
        setDialogOpen(false)
      } else {
        setVerificationStatus('error')
        setStatusMessage('Failed to send connection request. Please try again.')
      }
    } catch (error) {
      console.error('Connection failed:', error)
      setVerificationStatus('error')
      setStatusMessage('Failed to send connection request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Access code submission handler
  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Any input fulfills the requirement, but special handling for THENICHELIST
    if (accessCode.trim() === 'THENICHELIST') {
      // Special access code - mark as verified in database
      const formData = new FormData()
      formData.append('verified', 'true')
      formData.append('id', form.id.toString())

      try {
        const response = await fetch('/api/post_profile', {
          method: 'PATCH',
          body: formData,
        });
        
        if (response.ok) {
          setAccessCodeVerified(true)
          setAccessCodeError(null)
          // Update the parent component's verification status
          setIsVerified(true)
          
        } else {
          setAccessCodeError('Failed to process access code')
        }
      } catch (error) {
        setAccessCodeError(`Failed to process access code ${error}`)
      }
    } else {
      // Any other input (including NA) - just proceed without verification
      setAccessCodeVerified(false)
      setAccessCodeError(null)
      nextQuestion()
    }
  }

  // Typewriter effect hook
  const useTypewriter = (text: string, speed: number = 50) => {
    const [displayText, setDisplayText] = useState('')
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
      setDisplayText('')
      setIsComplete(false)
      let i = 0
      const timer = setInterval(() => {
        if (i < text.length) {
          setDisplayText(text.slice(0, i + 1))
          i++
        } else {
          setIsComplete(true)
          clearInterval(timer)
        }
      }, speed)

      return () => clearInterval(timer)
    }, [text, speed])

    return { displayText, isComplete }
  }

  const { displayText: typedQuestion, isComplete: questionComplete } = useTypewriter(
    currentQuestion?.question || '', 
    40
  )

  const { displayText: typedDescription, isComplete: descriptionComplete } = useTypewriter(
    currentQuestion?.description || '', 
    30
  )

  // Initialize current question index based on form data
  useEffect(() => {
    // Inline the logic to avoid dependency issues while ensuring it only runs on mount
    let maxAccessible = 0
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      
      if (!isQuestionValid(question)) {
        maxAccessible = i
        break
      }
      maxAccessible = questions.length
    }
    setCurrentQuestionIndex(Math.min(maxAccessible, questions.length - 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - intentionally ignoring dependencies to prevent auto-advancement

  useEffect(() => {
    if (currentQuestion && !isComplete) {
      setShowQuestion(true)
      
      // Pre-populate input with existing value if question was already answered
      const existingValue = form[currentQuestion.field]
      if (existingValue && typeof existingValue === 'string') {
        setInputValue(existingValue)
      } else {
        setInputValue('')
      }
      
      // Focus input after question is typed
      const timer = setTimeout(() => {
        if (questionComplete) {
          if (currentQuestion.type === 'textarea') {
            textareaRef.current?.focus()
          } else if (currentQuestion.type === 'toggle') {
            // Try to focus the appropriate toggle ref based on layout
            if (hasProfileImage && currentQuestionIndex > 0) {
              toggleRef.current?.focus()
            } else {
              toggleRef2.current?.focus()
            }
          } else if (currentQuestion.type !== 'file') {
            inputRef.current?.focus()
          }
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentQuestion, questionComplete, isComplete, currentQuestionIndex, form, hasProfileImage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentQuestion || isComplete) return

    const trimmedValue = inputValue.trim()
    
    // Validation - don't proceed if required field is empty
    if (currentQuestion.required && !trimmedValue) {
      return
    }

    if (currentQuestion.type === 'toggle') {
      return
    }

    // Update form state
    setForm(prev => ({ ...prev, [currentQuestion.field]: trimmedValue }))
    
    // Post the field update to the server
    await postFieldUpdate(currentQuestion.field, trimmedValue)
    
    // Move to next question only if we can proceed
    if (canProceedToNext()) {
      nextQuestion()
    }
  }

  const nextQuestion = async () => {
    // Don't proceed if current question isn't valid
    if (!canProceedToNext()) {
      return
    }

    // Post current field data if it hasn't been posted yet
    if (currentQuestion) {
      const currentValue = form[currentQuestion.field]
      if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
        await postFieldUpdate(currentQuestion.field, currentValue as string | boolean | File | Array<{name: string, email: string, connection: string}> | null)
      }
    }

    setInputValue('')
    setShowSchoolSuggestions(false)
    setShowQuestion(false)
    setTimeout(() => {
      const newIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(newIndex)
      // Notify parent component of completion status
      if (onComplete) {
        onComplete(newIndex >= questions.length)
      }
    }, 200)
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setInputValue('')
      setShowSchoolSuggestions(false)
      setShowQuestion(false)
      setTimeout(() => {
        const newIndex = currentQuestionIndex - 1
        setCurrentQuestionIndex(newIndex)
        // Notify parent component of completion status
        if (onComplete) {
          onComplete(newIndex >= questions.length)
        }
      }, 200)
    }
  }

  const handleToggleResponse = async (value: boolean) => {
    if (!currentQuestion) return
    
    setForm(prev => ({ ...prev, [currentQuestion.field]: value }))
    
    // Post the field update to the server
    await postFieldUpdate(currentQuestion.field, value)
    
    // For toggle questions, automatically proceed since they're simple yes/no choices
    setTimeout(() => {
      const newIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(newIndex)
      if (onComplete) {
        onComplete(newIndex >= questions.length)
      }
    }, 200)
  }

  const handleFileUpload = async (file: File) => {
    if (!currentQuestion) return
    
    // Different validation for profile images vs documents
    const isProfileImage = currentQuestion.field === 'profile_image'
    const maxSize = isProfileImage ? 2 * 1024 * 1024 : 5 * 1024 * 1024 // 2MB for images, 5MB for documents
    
    if (file.size > maxSize) {
      alert(`File size must be less than ${isProfileImage ? '2MB' : '5MB'}`)
      return
    }
    
    // For profile images, validate file type
    if (isProfileImage) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!validImageTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, or GIF)')
        return
      }
    }
    
    // Update form state immediately
    setForm(prev => ({ ...prev, [currentQuestion.field]: file }))
    
    // Show uploading state for all file uploads
    if (isProfileImage) {
      setIsUploadingProfileImage(true)
    } else {
      setIsUploadingFile(true)
    }
    
    try {
      const success = await postFieldUpdate(currentQuestion.field, file)
      if (!success) {
        alert(`Failed to upload ${isProfileImage ? 'profile image' : 'file'}. Please try again.`)
        return
      }
      // Mark upload as complete
      setUploadComplete(prev => ({ ...prev, [currentQuestion.field]: true }))
    } catch (error) {
      console.error(`Error uploading ${isProfileImage ? 'profile image' : 'file'}:`, error)
      alert(`Error uploading ${isProfileImage ? 'profile image' : 'file'}. Please try again.`)
      return
    } finally {
      if (isProfileImage) {
        setIsUploadingProfileImage(false)
      } else {
        setIsUploadingFile(false)
      }
    }
    
    // Don't automatically proceed - let user click Next when ready
  }

  const handleSchoolSearch = (value: string) => {
    setInputValue(value)
    
    if (value.length > 0 && currentQuestion?.options) {
      const filtered = currentQuestion.options.filter(school => 
        school.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredSchools(filtered)
      setShowSchoolSuggestions(filtered.length > 0)
    } else {
      setShowSchoolSuggestions(false)
    }
  }

  const selectSchool = (school: string) => {
    setInputValue(school)
    setShowSchoolSuggestions(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && currentQuestion?.type !== 'textarea') {
      e.preventDefault()
      handleSubmit(e as React.FormEvent)
    }
    if (e.key === 'Escape' && currentQuestionIndex > 0) {
      e.preventDefault()
      previousQuestion()
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <CheckCircle className="w-16 h-1 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">All done!</h2>
          <p className="text-lg text-gray-600">Your profile information has been collected successfully.</p>
        </div>
      </div>
    )
  }

  if (!currentQuestion) return null

  // Calculate progress percentage
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* Progress Bar */}
      {showQuestion && (
        <div className="w-full max-w-6xl mx-auto px-8 mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-neutral-900 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
      {/* Two-column layout when profile image exists */}
      {showQuestion && hasProfileImage && currentQuestionIndex > 1 ? (
        <div className="flex-1 flex items-center max-w-6xl mx-auto w-full gap-12">
          {/* Left side - Profile Picture */}
          <div className="w-1/3">
            <div className="text-center">
              <ProfileAvatar
                name={`${form.first_name || ''} ${form.last_name || ''}`.trim() || form.email || 'User'}
                imageUrl={form.profile_image_url || undefined}
                size={250}
                editable={false}
                className="w-64 h-64 rounded-full mx-auto"
              />
              {/* <p className="text-sm text-gray-500 mt-4">Click to change photo</p> */}
            </div>
          </div>

          {/* Right side - Question area */}
          <div className="w-2/3">
            {showQuestion && (
              <>
                {/* Navigation buttons */}
                <div className="mb-6 flex justify-between items-center">
                  {/* Back button */}
                  {currentQuestionIndex > 0 ? (
                    <Button
                      onClick={previousQuestion}
                      variant="ghost"
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                  ) : (
                    <div></div> // Empty div to maintain layout
                  )}

                  {/* Next button */}
                  {currentQuestionIndex < questions.length - 1 && (
                    <Button
                      onClick={nextQuestion}
                      disabled={!canProceedToNext()}
                      variant="ghost"
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Animated question */}
                <h1 className="text-4xl font-bold text-gray-900 mb-4 min-h-[3rem]">
                  {typedQuestion}
                  {!questionComplete && <span className="animate-pulse">|</span>}
                </h1>
                

                {/* Animated description */}
                {currentQuestion.description && (
                  <div className="text-xl text-gray-600 mb-8 min-h-[1.5rem] space-y-4">
                    {questionComplete ? (
                      <>
                        {typedDescription.split('\n').map((line, index, array) => (
                          <p key={index} className={line.trim() === '' ? 'h-4' : ''}>
                            {line}
                            {index === array.length - 1 && !descriptionComplete && <span className="animate-pulse">|</span>}
                          </p>
                        ))}
                      </>
                    ) : null}
                  </div>
                )}

                {/* Input area - only show after question is fully typed */}
                {questionComplete && (descriptionComplete || !currentQuestion.description) && (
                  <div className="space-y-4">
                    {currentQuestion.type === 'toggle' && (
                  <div 
                    ref={toggleRef}
                    className="flex gap-4"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.stopPropagation()
                        handleToggleResponse(true) // Default to "Yes" on Enter
                      }
                    }}
                  >
                    <Button
                      onClick={() => handleToggleResponse(true)}
                      className="flex-1 py-6 text-lg bg-neutral-900 hover:bg-neutral-800 text-white"
                    >
                      Yes
                    </Button>
                    <Button
                      onClick={() => handleToggleResponse(false)}
                      variant="outline"
                      className="flex-1 py-6 text-lg hover:bg-gray-50"
                    >
                      No
                    </Button>
                  </div>
                )}

                {currentQuestion.type === 'file' && (
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={currentQuestion.field === 'profile_image' ? 'image/*' : 'application/pdf,.pdf,.doc,.docx'}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                      }}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={(isUploadingProfileImage && currentQuestion.field === 'profile_image') || (isUploadingFile && currentQuestion.field !== 'profile_image')}
                      className="w-full py-6 text-lg flex items-center justify-center gap-3"
                      variant="outline"
                    >
                      <Upload className="w-5 h-5" />
                      {(isUploadingProfileImage && currentQuestion.field === 'profile_image') || (isUploadingFile && currentQuestion.field !== 'profile_image')
                        ? 'Uploading...' 
                        : uploadComplete[currentQuestion.field]
                        ? 'Upload Complete ✓'
                        : (currentQuestion.field === 'profile_image' ? 'Upload Photo' : 'Choose File')
                      }
                    </Button>
                    {currentQuestion.field === 'resume_file' && form.resume_url && !form.resume_file && (
                      <p className="text-sm text-gray-600 text-center">
                        Current: <a href={form.resume_url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">View uploaded resume</a>
                      </p>
                    )}
                    {currentQuestion.field === 'transcript_file' && form.transcript_url && !form.transcript_file && (
                      <p className="text-sm text-gray-600 text-center">
                        Current: <a href={form.transcript_url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">View uploaded transcript</a>
                      </p>
                    )}
                  </div>
                )}

                {currentQuestion.type === 'textarea' && (
                  <form onSubmit={handleSubmit}>
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={currentQuestion.placeholder}
                      className="w-full min-h-[120px] p-4 text-lg border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 resize-none transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault()
                          handleSubmit(e as React.FormEvent)
                        }
                      }}
                    />
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-sm text-gray-500">Press Cmd+Enter to continue</p>
                      {!currentQuestion.required && (
                        <Button
                          type="button"
                          onClick={nextQuestion}
                          variant="ghost"
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Skip
                        </Button>
                      )}
                    </div>
                  </form>
                )}

                 {currentQuestion.type === 'companies' && (
                    <div className="space-y-6">
                      {loadingCompanies ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
                          <p className="mt-2 text-neutral-600">Loading companies...</p>
                        </div>
                      ) : companies.length > 0 ? (
                          <CompanyCarousel companies={companies} />
                          
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-neutral-600 mb-4">No companies available at the moment.</p>
                          <Button
                            onClick={() => {
                              setTimeout(() => {
                                const newIndex = currentQuestionIndex + 1
                                setCurrentQuestionIndex(newIndex)
                                if (onComplete) {
                                  onComplete(newIndex >= questions.length)
                                }
                              }, 200)
                            }}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-3"
                          >
                            Continue to Networking
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {currentQuestion.type === 'networking' && (
                    <div className="space-y-6">
                      {loadingProfiles ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
                          <p className="mt-2 text-neutral-600">Loading people...</p>
                        </div>
                      ) : (
                        <>
                          {/* Search Bar */}
                          <div className="max-w-md mx-auto relative mb-8">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
                            <Input
                              type="text"
                              placeholder="Search by name..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 pr-4 py-2 w-full rounded-full border-neutral-200 focus:border-black focus:ring-black"
                            />
                          </div>

                          {/* Recommended Profiles from Same School */}
                          {!searchQuery.trim() && form.school && (
                            <div className="max-w-4xl mx-auto mb-8">
                              <h4 className="text-lg font-semibold text-neutral-900 mb-4 text-center">
                                Recommended To You
                              </h4>
                              <div className="grid gap-4 md:grid-cols-2">
                                {allProfiles
                                  .filter(profile => profile.school === form.school && profile.id !== form.id)
                                  .slice(0, 4)
                                  .map((profile) => (
                                    <Dialog key={profile.id} open={selectedProfile?.id === profile.id} onOpenChange={(open) => {
                                      if (!open) {
                                        handleDialogChange(false)
                                      } else {
                                        handleDialogChange(true)
                                        handleConnectClick(profile)
                                      }
                                    }}>
                                      <DialogTrigger asChild>
                                        <div>
                                          <ProfileCard
                                            profile={profile}
                                            onClick={() => {handleConnectClick(profile)}}
                                            connectionStatus={getConnectionStatus(profile)}
                                          />
                                        </div>
                                      </DialogTrigger>
                                      <DialogContent className="sm:max-w-xl w-full px-12 py-8">
                                        <DialogHeader>
                                          <DialogTitle>
                                            {getConnectionStatus(profile) === 'requested' 
                                              ? `Accept Connection Request from ${profile.first_name}`
                                              : `Connect with ${profile.first_name}`
                                            }
                                          </DialogTitle>
                                          <DialogDescription>
                                            {getConnectionStatus(profile) === 'requested'
                                              ? `${profile.first_name} has sent you a connection request. Rate your connection strength to accept and add them to your network.`
                                              : `To add ${profile.first_name} to your verified network, please rate your connection strength. This helps us maintain network quality and provide better recommendations.`
                                            }
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-6 mt-6">
                                          <ConnectionScale
                                            onSubmit={handleConnectionScale}
                                            isSubmitting={isSubmitting}
                                            personName={profile.first_name}
                                          
                                          />
                                          
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  ))}
                              </div>
                              {allProfiles.filter(profile => profile.school === form.school && profile.id !== form.id).length === 0 && (
                                <p className="text-center text-neutral-500 text-sm">
                                  No other students from {form.school} have joined yet.
                                </p>
                              )}
                            </div>
                          )}

                          {/* Search Results - Profile Rows */}
                          {searchQuery.trim() && (
                            <div className="max-w-4xl mx-auto space-y-4 mb-8">
                              {searchResults.length > 0 ? (
                                searchResults.slice(0, 6).map((profile) => (
                                  <div key={profile.id} className="bg-white border border-neutral-200 rounded-2xl p-6 flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                      <ProfileAvatar
                                        name={`${profile.first_name} ${profile.last_name}`}
                                        imageUrl={profile.profile_image_url || undefined}
                                        size={64}
                                        editable={false}
                                        className="w-16 h-16 rounded-full flex-shrink-0"
                                      />
                                      <div className="flex-1 text-left min-w-0">
                                        <h3 className="text-lg font-semibold text-neutral-900">
                                          {profile.first_name} {profile.last_name}
                                        </h3>
                                        {profile.bio && (
                                          <p className="text-sm text-neutral-600 line-clamp-2 mt-1 pr-2">
                                            {profile.bio}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex-shrink-0 ml-4">
                                      {(() => {
                                        const status = getConnectionStatus(profile);
                                        if (status === 'connected') {
                                          return (
                                            <Button disabled className="inline-flex items-center gap-2 bg-green-100 text-green-800 border-green-300 whitespace-nowrap">
                                              <UserPlus className="w-4 h-4" />
                                              Connected
                                            </Button>
                                          );
                                        } else if (status === 'pending_sent') {
                                          return (
                                            <Button disabled className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 border-yellow-300 whitespace-nowrap">
                                              <UserPlus className="w-4 h-4" />
                                              Request Sent
                                            </Button>
                                          );
                                        } else {
                                          return (
                                            <Dialog open={selectedProfile?.id === profile.id} onOpenChange={(open) => {
                                              if (!open) {
                                                handleDialogChange(false)
                                              } else {
                                                handleDialogChange(true)
                                                handleConnectClick(profile)
                                              }
                                            }}>
                                              <DialogTrigger asChild>
                                                {status === 'requested' ? (
                                                  <Button className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 whitespace-nowrap" onClick={() => handleConnectClick(profile)}>
                                                    <UserPlus className="w-4 h-4" />
                                                    Accept Request
                                                  </Button>
                                                ) : (
                                                  <Button className="inline-flex items-center gap-2 whitespace-nowrap" onClick={() => handleConnectClick(profile)}>
                                                    <UserPlus className="w-4 h-4" />
                                                    Add to Network
                                                  </Button>
                                                )}
                                              </DialogTrigger>
                                              <DialogContent className="sm:max-w-xl w-full px-12 py-8">
                                                <DialogHeader>
                                                  <DialogTitle>
                                                    {getConnectionStatus(profile) === 'requested' 
                                                      ? `Accept Connection Request from ${profile.first_name}`
                                                      : `Connect with ${profile.first_name}`
                                                    }
                                                  </DialogTitle>
                                                  <DialogDescription>
                                                    {getConnectionStatus(profile) === 'requested'
                                                      ? `${profile.first_name} has sent you a connection request. Rate your connection strength to accept and add them to your network.`
                                                      : `To add ${profile.first_name} to your verified network, please rate your connection strength. This helps us maintain network quality and provide better recommendations.`
                                                    }
                                                  </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-6 mt-6">
                                                  <ConnectionScale
                                                    onSubmit={handleConnectionScale}
                                                    isSubmitting={isSubmitting}
                                                    personName={profile.first_name}
                                                  />
                                                  
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
                                                </div>
                                              </DialogContent>
                                            </Dialog>
                                          );
                                        }
                                      })()}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8 text-neutral-600">
                                  No people found matching {searchQuery}
                                </div>
                              )}
                            </div>
                          )}


                          {/* Connection Dialog */}
                          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
                            <DialogContent className="sm:max-w-xl w-full px-12 py-8">
                              <DialogHeader>
                                <DialogTitle>
                                  {getConnectionStatus(selectedProfile!) === 'requested' 
                                    ? `Accept Connection Request from ${selectedProfile?.first_name}`
                                    : `Connect with ${selectedProfile?.first_name}`
                                  }
                                </DialogTitle>
                                <DialogDescription>
                                  {getConnectionStatus(selectedProfile!) === 'requested'
                                    ? `${selectedProfile?.first_name} has sent you a connection request. Rate your connection strength to accept and add them to your network.`
                                    : `To add ${selectedProfile?.first_name} to your verified network, please rate your connection strength. This helps us maintain network quality and provide better recommendations.`
                                  }
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6 mt-6">
                                <ConnectionScale
                                  onSubmit={handleConnectionScale}
                                  isSubmitting={isSubmitting}
                                  personName={selectedProfile?.first_name}
                                />
                                
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
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </div>
                  )}

                  {currentQuestion.type === 'network_recommendations' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {[0, 1].map((index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <h4 className="font-medium text-gray-900">Person {index + 1}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <Input
                                placeholder="Full Name"
                                value={form.network_recommendations?.[index]?.name || ''}
                                onChange={(e) => {
                                  const newRecommendations = [...(form.network_recommendations || [{ name: '', email: '', connection: '' }, { name: '', email: '', connection: '' }])]
                                  newRecommendations[index] = { ...newRecommendations[index], name: e.target.value }
                                  setForm(prev => ({ ...prev, network_recommendations: newRecommendations }))
                                }}
                                className="text-base"
                              />
                              <Input
                                placeholder="Email"
                                type="email"
                                value={form.network_recommendations?.[index]?.email || ''}
                                onChange={(e) => {
                                  const newRecommendations = [...(form.network_recommendations || [{ name: '', email: '', connection: '' }, { name: '', email: '', connection: '' }])]
                                  newRecommendations[index] = { ...newRecommendations[index], email: e.target.value }
                                  setForm(prev => ({ ...prev, network_recommendations: newRecommendations }))
                                }}
                                className="text-base"
                              />
                              <Input
                                placeholder="How do you know them?"
                                value={form.network_recommendations?.[index]?.connection || ''}
                                onChange={(e) => {
                                  const newRecommendations = [...(form.network_recommendations || [{ name: '', email: '', connection: '' }, { name: '', email: '', connection: '' }])]
                                  newRecommendations[index] = { ...newRecommendations[index], connection: e.target.value }
                                  setForm(prev => ({ ...prev, network_recommendations: newRecommendations }))
                                }}
                                className="text-base"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    
                    </div>
                  )}

                  {currentQuestion.type === 'welcome' && (
                    <div className="space-y-6">
                      <form onSubmit={handleAccessCodeSubmit} className="mt-6 p-4 rounded-lg">
                        <div className="flex flex-col gap-3">
                          <label htmlFor="accessCode" className="text-sm font-medium text-gray-700">
                            Special Access Code
                          </label>
                          <p className="text-sm">
                            Enter your special access code if you have one, or type &quot;NA&quot; if you don&apos;t have one.
                          </p>
                          {accessCodeVerified ? (
                            <Alert>
                              <AlertDescription>
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-neutral-900 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Access Code Verified!</span>
                                  </div>
                                </div>
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <>
                              <div className="flex gap-2">
                                <Input
                                  id="accessCode"
                                  type="text"
                                  value={accessCode}
                                  onChange={(e) => setAccessCode(e.target.value)}
                                  placeholder="Enter access code or NA if you do not have one"
                                  className="flex-1"
                                />
                                <Button
                                  type="submit"
                                  disabled={!accessCode.trim()}
                                >
                                  Submit
                                </Button>
                              </div>
                              {accessCodeError && (
                                <p className="text-sm text-red-600">{accessCodeError}</p>
                              )}
                            </>
                          )}
                        </div>
                      </form>
                    </div>
                  )}

                {currentQuestion.type !== 'toggle' && currentQuestion.type !== 'file' && currentQuestion.type !== 'textarea' && currentQuestion.type !== 'companies' && currentQuestion.type !== 'networking' && currentQuestion.type !== 'network_recommendations' && currentQuestion.type !== 'welcome' && (
                  <form onSubmit={handleSubmit}>
                    <div className="relative">
                      <Input
                        ref={inputRef}
                        type={currentQuestion.type}
                        value={inputValue}
                        onChange={(e) => {
                          if (currentQuestion.field === 'school') {
                            handleSchoolSearch(e.target.value)
                          } else {
                            setInputValue(e.target.value)
                          }
                        }}
                        placeholder={currentQuestion.placeholder}
                        className="w-full py-6 px-4 text-lg border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all"
                        onKeyDown={handleKeyPress}
                      />
                      
                      {/* School suggestions dropdown */}
                      {showSchoolSuggestions && filteredSchools.length > 0 && currentQuestion.field === 'school' && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                          {filteredSchools.map((school, index) => (
                            <div
                              key={index}
                              onClick={() => selectSchool(school)}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-lg"
                            >
                              {school}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-sm text-gray-500">Press Enter to continue</p>
                      {!currentQuestion.required && (
                        <Button
                          type="button"
                          onClick={nextQuestion}
                          variant="ghost"
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Skip
                        </Button>
                      )}
                    </div>
                  </form>
                  )}
                </div>
              )}
            </>
          )}
          </div>
        </div>
      ) : showQuestion ? (
        /* Single-column layout for first question (profile picture) or when no image */
        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
          {showQuestion && (
            <>
              {/* Navigation buttons */}
              <div className="mb-6 flex justify-between items-center">
                {/* Back button */}
                {currentQuestionIndex > 0 ? (
                  <Button
                    onClick={previousQuestion}
                    variant="ghost"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                ) : (
                  <div></div> // Empty div to maintain layout
                )}

                {/* Next button */}
                {currentQuestionIndex < questions.length - 1 && (
                  <Button
                    onClick={nextQuestion}
                    disabled={!canProceedToNext()}
                    variant="ghost"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Animated question */}
              <h1 className="text-4xl font-bold text-gray-900 mb-4 min-h-[3rem]">
                {typedQuestion}
                {!questionComplete && <span className="animate-pulse">|</span>}
              </h1>
              

              {/* Animated description */}
              {currentQuestion.description && (
                <div className="text-xl text-gray-600 mb-8 min-h-[1.5rem] space-y-4">
                  {questionComplete ? (
                    <>
                      {typedDescription.split('\n').map((line, index, array) => (
                        <p key={index} className={line.trim() === '' ? 'h-4' : ''}>
                          {line}
                          {index === array.length - 1 && !descriptionComplete && <span className="animate-pulse">|</span>}
                        </p>
                      ))}
                    </>
                  ) : null}
                </div>
              )}

              {/* Input area - only show after question is fully typed */}
              {questionComplete && (descriptionComplete || !currentQuestion.description) && (
                <div className="space-y-4">
                  
                  {currentQuestion.type === 'toggle' && (
                    <div 
                      ref={toggleRef2}
                      className="flex gap-4"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          e.stopPropagation()
                          handleToggleResponse(true) // Default to "Yes" on Enter
                        }
                      }}
                    >
                      <Button
                        onClick={() => handleToggleResponse(true)}
                        className="flex-1 py-6 text-lg bg-neutral-900 hover:bg-neutral-800 text-white"
                      >
                        Yes
                      </Button>
                      <Button
                        onClick={() => handleToggleResponse(false)}
                        variant="outline"
                        className="flex-1 py-6 text-lg hover:bg-gray-50"
                      >
                        No
                      </Button>
                    </div>
                  )}

                  {currentQuestion.type === 'file' && (
                    <div className="space-y-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={currentQuestion.field === 'profile_image' ? 'image/*' : 'application/pdf,.pdf,.doc,.docx'}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file)
                        }}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={(isUploadingProfileImage && currentQuestion.field === 'profile_image') || (isUploadingFile && currentQuestion.field !== 'profile_image')}
                        className="w-full py-6 text-lg flex items-center justify-center gap-3"
                        variant="outline"
                      >
                        <Upload className="w-5 h-5" />
                        {(isUploadingProfileImage && currentQuestion.field === 'profile_image') || (isUploadingFile && currentQuestion.field !== 'profile_image')
                          ? 'Uploading...' 
                          : uploadComplete[currentQuestion.field]
                          ? 'Upload Complete ✓'
                          : (currentQuestion.field === 'profile_image' ? 'Upload Photo' : 'Choose File')
                        }
                      </Button>
                      {currentQuestion.field === 'resume_file' && form.resume_url && !form.resume_file && (
                        <p className="text-sm text-gray-600 text-center">
                          Current: <a href={form.resume_url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">View uploaded resume</a>
                        </p>
                      )}
                      {currentQuestion.field === 'transcript_file' && form.transcript_url && !form.transcript_file && (
                        <p className="text-sm text-gray-600 text-center">
                          Current: <a href={form.transcript_url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">View uploaded transcript</a>
                        </p>
                      )}
                    </div>
                  )}

                 

                  {currentQuestion.type === 'textarea' && (
                    <form onSubmit={handleSubmit}>
                      <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={currentQuestion.placeholder}
                        className="w-full min-h-[120px] p-4 text-lg border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 resize-none transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault()
                            handleSubmit(e as React.FormEvent)
                          }
                        }}
                      />
                      <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-gray-500">Press Cmd+Enter to continue</p>
                        {!currentQuestion.required && (
                          <Button
                            type="button"
                            onClick={nextQuestion}
                            variant="ghost"
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Skip
                          </Button>
                        )}
                      </div>
                    </form>
                  )}

                  {currentQuestion.type === 'network_recommendations' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {[0, 1].map((index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <h4 className="font-medium text-gray-900">Person {index + 1}</h4>
                            <div className="space-y-3">
                              <Input
                                placeholder="Full Name"
                                value={form.network_recommendations?.[index]?.name || ''}
                                onChange={(e) => {
                                  const newRecommendations = [...(form.network_recommendations || [{ name: '', email: '', connection: '' }, { name: '', email: '', connection: '' }])]
                                  newRecommendations[index] = { ...newRecommendations[index], name: e.target.value }
                                  setForm(prev => ({ ...prev, network_recommendations: newRecommendations }))
                                }}
                                className="text-base"
                              />
                              <Input
                                placeholder="Email"
                                type="email"
                                value={form.network_recommendations?.[index]?.email || ''}
                                onChange={(e) => {
                                  const newRecommendations = [...(form.network_recommendations || [{ name: '', email: '', connection: '' }, { name: '', email: '', connection: '' }])]
                                  newRecommendations[index] = { ...newRecommendations[index], email: e.target.value }
                                  setForm(prev => ({ ...prev, network_recommendations: newRecommendations }))
                                }}
                                className="text-base"
                              />
                              <Input
                                placeholder="How do you know them?"
                                value={form.network_recommendations?.[index]?.connection || ''}
                                onChange={(e) => {
                                  const newRecommendations = [...(form.network_recommendations || [{ name: '', email: '', connection: '' }, { name: '', email: '', connection: '' }])]
                                  newRecommendations[index] = { ...newRecommendations[index], connection: e.target.value }
                                  setForm(prev => ({ ...prev, network_recommendations: newRecommendations }))
                                }}
                                className="text-base"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentQuestion.type === 'welcome' && (
                    <div className="space-y-6">
                      <form onSubmit={handleAccessCodeSubmit} className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex flex-col gap-3">
                          <label htmlFor="accessCode" className="text-sm font-medium text-gray-700">
                            Special Access Code
                          </label>
                          <p className="text-sm text-gray-600">
                            Enter your special access code if you have one, or type &quot;NA&quot; to bypass.
                          </p>
                          {accessCodeVerified ? (
                            <Alert>
                              <AlertDescription>
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-neutral-900 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Access Code Verified!</span>
                                  </div>
                                </div>
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <>
                              <div className="flex gap-2">
                                <Input
                                  id="accessCode"
                                  type="text"
                                  value={accessCode}
                                  onChange={(e) => setAccessCode(e.target.value)}
                                  placeholder="Enter access code or NA if you do not have one"
                                  className="flex-1"
                                />
                                <Button
                                  type="submit"
                                  disabled={!accessCode.trim()}
                                >
                                  Submit
                                </Button>
                              </div>
                              {accessCodeError && (
                                <p className="text-sm text-red-600">{accessCodeError}</p>
                              )}
                            </>
                          )}
                        </div>
                      </form>
                    </div>
                  )}

                  {currentQuestion.type !== 'toggle' && currentQuestion.type !== 'file' && currentQuestion.type !== 'textarea' && currentQuestion.type !== 'companies' && currentQuestion.type !== 'networking' && currentQuestion.type !== 'network_recommendations' && currentQuestion.type !== 'welcome' && (
                    <form onSubmit={handleSubmit}>
                      <div className="relative">
                        <Input
                          ref={inputRef}
                          type={currentQuestion.type}
                          value={inputValue}
                          onChange={(e) => {
                            if (currentQuestion.field === 'school') {
                              handleSchoolSearch(e.target.value)
                            } else {
                              setInputValue(e.target.value)
                            }
                          }}
                          placeholder={currentQuestion.placeholder}
                          className="w-full py-6 px-4 text-lg border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all"
                          onKeyDown={handleKeyPress}
                        />
                        
                        {/* School suggestions dropdown */}
                        {showSchoolSuggestions && filteredSchools.length > 0 && currentQuestion.field === 'school' && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                            {filteredSchools.map((school, index) => (
                              <div
                                key={index}
                                onClick={() => selectSchool(school)}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-lg"
                              >
                                {school}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-gray-500">Press Enter to continue</p>
                        {!currentQuestion.required && (
                          <Button
                            type="button"
                            onClick={nextQuestion}
                            variant="ghost"
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Skip
                          </Button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ) : null}

      
    </div>
  )
}