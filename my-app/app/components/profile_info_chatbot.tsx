'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProfileFormState, ProfileData, CompanyWithImageUrl } from '@/app/types'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Upload, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

import { CompanyCard } from '@/app/companies/company-cards'
import { ReferralDialog } from './referral-dialog'
import { PeopleSearch } from './people-search'
import { useRouter } from 'next/navigation'
interface Question {
  id: string
  index: number
  field: keyof ProfileFormState
  question: string
  type: 'text' | 'textarea' | 'file' | 'toggle' | 'url' | 'tel' | 'companies' | 'networking' | 'network_recommendations' | 'welcome' | 'outreach_frequency' | 'button'
  required: boolean
  placeholder?: string
  options?: string[] | { display: string; value: number }[]
  description?: string
}

const questions: Question[] = [
  // {
  //   id: 'welcome',
  //   index: 0,
  //   field: 'first_name', // Using existing field as placeholder
  //   question: "Welcome to The Niche!",
  //   description: "Our goal is to help you curate a personalized, professional network that aligns with your interests, skillsets, and verified by your existing professional community. We introduce you directly to opportunities and founders at some of the highest growth startups while helping you build your network. \nLet's build your profile!",
  //   type: 'button',
  //   required: true
  // },
  {
    id: 'profile_image',
    index: 0, 
    field: 'profile_image',
    question: "Let's start with your profile picture",
    description: "Upload a photo to help us get to know you better",
    type: 'file',
    required: true
  },
  // {
  //   id: 'school',
  //   index: 2, 
  //   field: 'school',
  //   question: "Which school do you attend or did you graduate from?",
  //   type: 'text',
  //   required: true,
  //   placeholder: 'Start typing your school name...',
  //   options: ['MIT', 'Harvard', 'Brown', 'Columbia', 'Georgia Tech', 'Stanford', 'Waterloo', 'UIUC', 'University of Michigan', 'UT Austin', 'Yale']
  // },
  // {
  //   id: 'phone',
  //   index: 1, 
  //   field: 'phone_number',
  //   question: "What's the best phone number to reach you at?",
  //   type: 'tel',
  //   required: true,
  //   placeholder: 'e.g. 555-123-4567'
  // },
  // {
  //   id: 'linkedin',
  //   index: 4, 
  //   field: 'linkedin_url',
  //   question: "What's your LinkedIn profile URL?",
  //   type: 'url',
  //   required: true,
  //   placeholder: 'https://www.linkedin.com/in/...'
  // },
  // {
  //   id: 'resume',
  //   index: 2, 
  //   field: 'resume_file',
  //   question: "Please upload your resume",
  //   description: "PDF, DOC, or DOCX files only (max 5MB)",
  //   type: 'file',
  //   required: true
  // },
  // {
  //   id: 'transcript',
  //   index: 6, 
  //   field: 'transcript_file',
  //   question: "Upload your transcript",
  //   description: "PDF, DOC, or DOCX files only (max 5MB)",
  //   type: 'file',
  //   required: true
  // },
  {
    id: 'bio',
    index: 1, 
    field: 'bio',
    question: "Tell us about yourself",
    description: "Give us an introduction of who you are, what you are interested in, and what you are currently doing.",
    type: 'textarea',
    required: true,
    placeholder: 'I currently lead product at OpenMind, a Series A startup building out software to help robots learn from each other...'
  },
  {
    id: 'website',
    index: 2, 
    field: 'personal_website',
    question: "Do you have a personal website?",
    description: "Optional - share if you have one",
    type: 'url',
    required: false,
    placeholder: 'https://yourwebsite.com'
  },
  {
    id: 'github_url',
    index: 3, 
    field: 'github_url',
    question: "Share your github",
    description: "Share the link - it should be of the format of https://github.com/username",
    type: 'url',
    required: true,
    placeholder: 'https://github.com/username'
  },
  {
    id: 'companies',
    index: 4, 
    field: 'bookmarked_companies', 
    question: "Explore opportunities",
    description: "The Niche partners with a select cohort of high talent-density startups. We want to get a better understanding of your interests. Please bookmark companies that interest you!",
    type: 'companies',
    required: false
  },
  // {
  //   id: 'public_profile',
  //   index: 8, 
  //   field: 'is_public_profile',
  //   question: "Allow founders to view your Niche profile?",
  //   description: "Allow your profile to be public to our partner companies so that when we warm intro, they can see your curated Niche profile.",
  //   type: 'toggle',
  //   required: true
  // },
  // {
  //   id: 'newsletter',
  //   index: 9, 
  //   field: 'newsletter_opt_in',
  //   question: "Stay updated with new company profiles?",
  //   description: "Get an email when we cover a new company. We drop a maximum of two company profiles each week.",
  //   type: 'toggle',
  //   required: true
  // },
  // {
  //   id: 'visa',
  //   index: 10, 
  //   field: 'needs_visa_sponsorship',
  //   question: "Do you need visa sponsorship?",
  //   description: "For employment in the US",
  //   type: 'toggle',
  //   required: true
  // },
  {
    id: 'networking',
    index: 5, 
    field: 'pending_connections_new', 
    question: "Curate your Professional Network",
    description: "Connect with 2-3 People Who You Want to Define Your Career Trajectory. We use your connections to tailor recommendations and opportunities for you.",
    type: 'networking',
    required: true
  },
  {
    id: 'network_recommendations',
    index: 6, 
    field: 'network_recommendations',
    question: "Recommend 2 or more of your smartest technical friends to The Niche.",
    description: "Build your verified professional network on The Niche. We index on your network to recommend you opportunities.",
    type: 'network_recommendations',
    required: true
  },
]


export default function ProfileInfoChatbot({
  form,
  setForm,
  onComplete,
  initialStep,
}: {
  form: ProfileFormState,
  setForm: React.Dispatch<React.SetStateAction<ProfileFormState>>
  onComplete?: (isComplete: boolean) => Promise<void> | void
  initialStep?: number
}) {
  const initialQuestionIndex = useMemo(() => {
    // Find the question index that matches the onboarding step
    const questionIndex = questions.findIndex(q => q.index === initialStep);
    return questionIndex !== -1 ? questionIndex : 0;
  }, [initialStep]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex)
  const [inputValue, setInputValue] = useState('')
  const [showQuestion, setShowQuestion] = useState(false)
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false)
  const [filteredSchools, setFilteredSchools] = useState<string[]>([])
  
  // Company and networking state
  const [companies, setCompanies] = useState<CompanyWithImageUrl[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [uploadComplete, setUploadComplete] = useState<{[key: string]: boolean}>({})
  const [currentUserData, setCurrentUserData] = useState<ProfileData | null>(null)
  const [buttonClicked, setButtonClicked] = useState<{[key: string]: boolean}>({})
  const [showNetworkReferralDialog, setShowNetworkReferralDialog] = useState(false)
  const [userReferralsCount, setUserReferralsCount] = useState(0)
  
  
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toggleRef = useRef<HTMLDivElement>(null)
  const toggleRef2 = useRef<HTMLDivElement>(null)

  const router = useRouter()

  const currentQuestion = questions[currentQuestionIndex]
  const isComplete = currentQuestionIndex >= questions.length
  const hasProfileImage = form.profile_image || form.profile_image_url

  // Shared validation logic for any question
  const isQuestionValid = useCallback((question: typeof questions[0]) => {
    if (!question) return true
    if (!question.required) return true
    
    // If this question comes before the initialStep, consider it already completed
    if (initialStep && question.index < initialStep) return true
    
    // Handle button type questions - valid only after clicked
    if (question.type === 'button') {
      return buttonClicked[question.id] || false
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

    // Handle network recommendations - check if user has submitted 2+ referrals
    if (field === 'network_recommendations') {
      return userReferralsCount >= 2
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
  }, [form, currentUserData, buttonClicked, initialStep, userReferralsCount])

  // Validation function to check if current question is satisfied
  const isCurrentQuestionValid = () => {
    return isQuestionValid(currentQuestion)
  }

  // Check if we can proceed to next question
  const canProceedToNext = () => {
    return isCurrentQuestionValid() 
  }


  // Function to post individual field updates
  const postFieldUpdate = async (field: keyof ProfileFormState, value: string | boolean | number | File | Array<{name: string, email: string, connection: string}> | null) => {
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
      } else if (typeof value === 'number') {
        formData.append(field as string, value.toString())
      } else if (value !== null && value !== undefined) {
        formData.append(field as string, value.toString())
      }

      formData.append('onboarding_step', String(questions[currentQuestionIndex + 1]?.index))
      
      const response = await fetch('/api/post_profile', {
        method: 'PATCH',
        body: formData,
      })
      
      if (response.ok) {
        const result = await response.json()
        
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
      setCompanies(shuffled.slice(0, 5))
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  const loadAllProfiles = async () => {
    setLoadingProfiles(true)
    
    // Load profiles and user data independently and asynchronously
    const loadProfiles = async () => {
      try {
        const response = await fetch('/api/get_cohort', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setAllProfiles(data.profiles || [])
        } else {
          console.error('Failed to load profiles')
          setAllProfiles([])
        }
      } catch (error) {
        console.error('Error loading profiles:', error)
        setAllProfiles([])
      }
    }
    
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/get_profile', { credentials: 'include' })
        if (response.ok) {
          const userData = await response.json()
          setCurrentUserData(userData)
        } else {
          console.error('Failed to load user data')
          setCurrentUserData(null)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        setCurrentUserData(null)
      }
    }
    
    // Start both requests simultaneously but don't wait for both to complete
    // This allows the UI to update as soon as either request finishes
    Promise.all([loadProfiles(), loadUserData()]).finally(() => {
      setLoadingProfiles(false)
    })
  }

  const loadUserReferrals = async () => {
    // Make this truly async and non-blocking
    fetch(`/api/get_user_referrals?user_id=${form.id}`, {
      credentials: 'include'
    })
    .then(response => {
      if (response.ok) {
        return response.json()
      }
      throw new Error('Failed to load referrals')
    })
    .then(data => {
      setUserReferralsCount(data.length || 0)
    })
    .catch(error => {
      console.error('Error loading user referrals:', error)
      setUserReferralsCount(0)
    })
  }

  // Load data when reaching companies, networking, or network_recommendations questions
  useEffect(() => {
    if (currentQuestion?.type === 'companies' && companies.length === 0) {
      loadCompanies()
    }
    // Only load profiles when user actually reaches networking question
    if (currentQuestion?.type === 'networking' && allProfiles.length === 0) {
      loadAllProfiles()
    }
    // Only load user referrals when user actually reaches network recommendations question  
    if (currentQuestion?.type === 'network_recommendations') {
      loadUserReferrals()
    }
  }, [currentQuestion?.type, companies.length, allProfiles.length, form.id])

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
        <CompanyCard key={currentCompany._id} company={currentCompany} external={!currentCompany.partner}/>
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
    
    </div>
  )
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
        await postFieldUpdate(currentQuestion.field, currentValue as string | boolean | number | File | Array<{name: string, email: string, connection: string}> | null)
      }
    }

    setInputValue('')
    setShowSchoolSuggestions(false)
    setShowQuestion(false)

    const newIndex = currentQuestionIndex + 1
    const isCompleting = newIndex >= questions.length

    setTimeout(async () => {
      setCurrentQuestionIndex(newIndex)

      // If completing, notify parent and wait for it to finish before redirecting
      if (isCompleting && onComplete) {
        await onComplete(true)
        router.push('/profile')
      } else if (onComplete) {
        // Not completing, just notify parent
        onComplete(false)
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
    const newIndex = currentQuestionIndex + 1
    const isCompleting = newIndex >= questions.length

    setTimeout(async () => {
      setCurrentQuestionIndex(newIndex)

      // If completing, notify parent and wait for it to finish before redirecting
      if (isCompleting && onComplete) {
        await onComplete(true)
        router.push('/profile')
      } else if (onComplete) {
        // Not completing, just notify parent
        onComplete(false)
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
    
    if (value.length > 0 && currentQuestion?.options && Array.isArray(currentQuestion.options) && 
        currentQuestion.options.every(opt => typeof opt === 'string')) {
      const filtered = (currentQuestion.options as string[]).filter(school => 
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">All done!</h2>
          <p className="text-lg text-gray-600">
            We&apos;re creating your profile. You&apos;ll be able to see it soon...
          </p>
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
          <div className="flex justify-between items-center mb-4">
            {/* Back button */}
            {currentQuestionIndex > 0 ? (
              <Button
                onClick={previousQuestion}
                variant="ghost"
                className="flex items-center gap-2 text-neutral-400 hover:text-neutral-800 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div className="text-sm text-neutral-400">
                ~3 min to complete
              </div>
            )}

            {/* Next/Complete button */}
            {currentQuestion.type !== 'button' && (
              <Button
                onClick={nextQuestion}
                disabled={!canProceedToNext()}
                variant="ghost"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentQuestionIndex >= questions.length - 1 ? 'Activate Profile' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="bg-neutral-900 dark:bg-neutral-100 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Two-column layout for all questions */}
      {showQuestion ? (
        <div className="flex-1 flex items-center max-w-6xl mx-auto w-full px-8">
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start text-center ">
            {/* Left side - Question and Description */}
            <div className="flex items-center min-h-full">
              <div className="space-y-3">
              {/* Animated question */}
              <div>
                <h1 className="text-4xl font-bold text-neutral-200">
                  {typedQuestion}
                  {!questionComplete && <span className="animate-pulse">|</span>}
                </h1>
              </div>

              {/* Animated description */}
              {currentQuestion.description && (
                <div>
                  {questionComplete && (
                    <div className="text-lg text-neutral-400 space-y-2">
                      {typedDescription.split('\n').map((line, index, array) => (
                        <p key={index} className={line.trim() === '' ? 'h-4' : ''}>
                          {line}
                          {index === array.length - 1 && !descriptionComplete && <span className="animate-pulse">|</span>}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>

            {/* Right side - Input area */}
            <div className="flex items-center justify-center min-h-full">
              {questionComplete && (descriptionComplete || !currentQuestion.description) && (
                <div className="space-y-4 w-full">
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
                      className={`flex-1 py-6 text-lg ${
                        form[currentQuestion.field] === true
                          ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                          : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                      }`}
                    >
                      Yes
                    </Button>
                    <Button
                      onClick={() => handleToggleResponse(false)}
                      className={`flex-1 py-6 text-lg ${
                        form[currentQuestion.field] === false
                          ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                          : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                      }`}
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
                          <p className="mt-2 text-neutral-400">Loading companies...</p>
                        </div>
                      ) : companies.length > 0 ? (
                          <CompanyCarousel companies={companies} />
                          
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-neutral-400 mb-4">No companies available at the moment.</p>
                          <Button
                            onClick={() => {
                              const newIndex = currentQuestionIndex + 1
                              const isCompleting = newIndex >= questions.length

                              setTimeout(async () => {
                                setCurrentQuestionIndex(newIndex)

                                // If completing, notify parent and wait for it to finish before redirecting
                                if (isCompleting && onComplete) {
                                  await onComplete(true)
                                  router.push('/profile')
                                } else if (onComplete) {
                                  // Not completing, just notify parent
                                  onComplete(false)
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
                    <div>
                      <PeopleSearch
                        allProfiles={allProfiles}
                        currentUserData={currentUserData}
                        loadingProfiles={loadingProfiles}
                        currentUserId={form.id}
                        onConnectionUpdate={() => {
                          // Reload user data when connection is updated
                          loadAllProfiles()
                        }}
                      />
                    </div>
                  )}

                  {currentQuestion.type === 'network_recommendations' && (
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <Button
                          onClick={() => setShowNetworkReferralDialog(true)}
                          className="px-8 py-4 text-lg bg-neutral-900 hover:bg-neutral-800 text-white"
                        >
                          Recommend a Friend
                        </Button>
                      </div>
                      
                      {/* Show submitted recommendations count */}
                      {userReferralsCount > 0 && (
                        <div className="rounded-lg p-4">
                          {userReferralsCount} recommendation(s) submitted
                        </div>
                      )}
                    </div>
                  )}

                  {currentQuestion.type === 'button' && (
                    <div className="space-y-6">
                      <div className="flex justify-start">
                        <Button
                          onClick={() => {
                            setButtonClicked(prev => ({ ...prev, [currentQuestion.id]: true }))
                            nextQuestion()
                          }}
                          className="px-12 py-6 text-lg bg-neutral-900 hover:bg-neutral-800 text-white"
                        >
                          Build my Niche Profile
                        </Button>
                      </div>
                    </div>
                  )}

                {currentQuestion.type !== 'toggle' && currentQuestion.type !== 'file' && currentQuestion.type !== 'textarea' && currentQuestion.type !== 'companies' && currentQuestion.type !== 'networking' && currentQuestion.type !== 'network_recommendations' && currentQuestion.type !== 'button' && currentQuestion.type !== 'outreach_frequency' && (
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
                        <div className="absolute top-full left-0 right-0 mt-2 border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
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
            </div>
          </div>
        </div>
      ) : null}

      
      {/* Network Referral Dialog */}
      <ReferralDialog 
        open={showNetworkReferralDialog}
        onOpenChange={(open) => {
          setShowNetworkReferralDialog(open)
          // Refresh referrals count when dialog closes
          if (!open && currentQuestion?.type === 'network_recommendations') {
            loadUserReferrals()
          }
        }}
        title="Recommend a Friend to The Niche"
        description="Help us grow our network by recommending your smartest technical friends"
        forceFormMode={true}
      />
    </div>
  )
}