'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Megaphone, CheckCircle, Copy, AlertCircle, Eye, Send, Repeat2  } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CompanyCard } from '@/app/companies/company-cards'
import { CompanyWithImageUrl, MediaLibraryItem } from '@/app/types'
import { useRouter } from 'next/navigation'
import { Navigation } from "@/app/components/header";
import CompanyPageClient from "@/app/components/company-page-client";
import { motion} from 'framer-motion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { ProtectedContent } from '../components/protected-content'

interface TourStep {
  id: string
  title: string
  description: string
  highlights: string[]
  actions?: Array<{
    id: string
    completed: boolean
    description: string
  }>
  completed: boolean
}

export default function TourPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  // Helper function to render text with bold formatting
  const renderDescription = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  const SlideInCard: React.FC<React.ComponentProps<'div'> & { slideDirection?: 'left' | 'right' }> = ({ 
    children, 
    className = '', 
    slideDirection = 'right'
  }) => {
    const isFromLeft = slideDirection === 'left'
    
    return (
      <motion.div
        initial={{ x: isFromLeft ? '-50%' : '50%', opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        exit={{ x: isFromLeft ? '-50%' : '50%', opacity: 0 }}
        transition={{ type: 'tween', duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true, amount: 0.1 }}
        className={className}
      >
        {children}
      </motion.div>
    )
  }
  
  // Real data from backend
  const [emailTracker, setEmailTracker] = useState('')
  const [companyPost, setCompanyPost] = useState<MediaLibraryItem | null>(null)

  
  // Tour step completion tracking
  const [tourSteps, setTourSteps] = useState<TourStep[]>([
    {
      id: 'opportunities',
      title: 'the opportunities page',
      description: 'this is where **you can request a warm intro** to opportunities at our partner startups or simply **connect directly to the founder**. demo mode is pre-loaded so none of these interactions will actually be sent!',
      highlights: [
        '**Click on the company below** to view their profile.',
        '**Click "request intro"** to request a warm intro to the founder either to learn more or to apply to the opportunity.',
        '**Thread your thoughts** on the opportunity once you have received an offer! Let others know your new status, get their opinion on the company, and reach others who have also received an offer.',
        '**Click share to send the company profile** with a customized link tied to your profile to people who you think would be a good fit for the opportunity and refer them to the network to apply!',
      ],
      actions: [
        { id: 'openModal', completed: false, description: 'View company profile' },
        { id: 'requestIntro', completed: false, description: 'Request warm introduction' },
        { id: 'repost', completed: false, description: 'Repost about company' },
        { id: 'share', completed: false, description: 'Share opportunity externally' }
      ],
      completed: false
    },
    {
      id: 'ats',
      title: 'the ats page',
      description: 'manage all your applications and processes in **one place**. track progress, set reminders, and **never miss a follow-up** simply by CCing your unique Niche application portal email when you correspond with recruiters and founders both **on and off The Niche network.**',
    highlights: [
        '**accept your Niche email**',
      ],
      actions: [
        { id: 'acceptATS', completed: false, description: 'Accept your Niche Application Portal Email' },
      ],
      completed: false
    }
  ])

  
  // Company detail simulation state
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithImageUrl | null>(null)
  const [showCompanyDialog, setShowCompanyDialog] = useState(false)
  
  // Remove showCards state as we'll use scroll-triggered animations


  // Load real data from backend
  useEffect(() => {
    const loadDemoData = async () => {
      try {
        // Run all async operations in parallel
        const [companiesRes, emailRes] = await Promise.all([
          fetch('/api/companies'),
          fetch('/api/get_all_applications')
        ])

        let demoCompany: CompanyWithImageUrl | null = null
        let companyPostData: MediaLibraryItem | null = null

        // Process companies data first
        if (companiesRes.ok) {
          const companiesData = await companiesRes.json()
          const partnerCompanies = companiesData.filter((c: CompanyWithImageUrl) => c.partner || c.pending_partner)
          const randomIndex = Math.floor(Math.random() * partnerCompanies.length)
          demoCompany = partnerCompanies[randomIndex]
          
          // Fetch company post data for the selected company
          if (demoCompany) {
            try {
              const companyPostRes = await fetch(`/api/company_posts?company_id=${demoCompany.company}`, {
                credentials: 'include'
              });
              if (companyPostRes.ok) {
                companyPostData = await companyPostRes.json();
              }
            } catch (error) {
              console.error('Error fetching company posts:', error);
            }
          }
        }

        let emailData: { tracking_email?: string } | null = null
        if (emailRes.ok) {
          emailData = await emailRes.json();
        }

        // Batch all state updates together in one synchronous operation
        React.startTransition(() => {
          if (demoCompany) {
            setSelectedCompany(demoCompany)
          }
          if (companyPostData) {
            setCompanyPost(companyPostData)
          }
          if (emailData?.tracking_email) {
            setEmailTracker(emailData.tracking_email)
          }
        })

      } catch (error) {
        console.error('Error loading demo data:', error)
      } finally {
        // Use a small delay to ensure state updates are processed
        setTimeout(() => setLoading(false), 100)
      }
    }

    loadDemoData()
  }, [])

  const markActionCompleted = (stepId: string, actionId: string) => {
    setTourSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        const updatedActions = step.actions?.map(action =>
          action.id === actionId ? { ...action, completed: true } : action
        ) || []
        
        // Check if all actions are completed
        const allActionsCompleted = updatedActions.every(action => action.completed)
        
        return {
          ...step,
          actions: updatedActions,
          completed: allActionsCompleted
        }
      }
      return step
    }))
  }

const [acknowledged, setAcknowledged] = useState(false)
const [copied, setCopied] = useState(false)



const onAcknowledge = () => {
  setAcknowledged(true)
  // mark the single action complete and the step as done
  setTourSteps(prev =>
    prev.map(s =>
      s.id === 'ats'
        ? {
            ...s,
            actions: s.actions?.map(a => (a.id === 'acceptATS' ? { ...a, completed: true } : a)),
            completed: true
          }
        : s
    )
  )
}

const copyEmail = async () => {
  try {
    await navigator.clipboard.writeText(emailTracker)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  } catch (e) {
    console.error('Copy failed', e)
  }
}

  const [showCongratulationsDialog, setShowCongratulationsDialog] = useState(false)

  // Check if all steps are completed and show congratulations dialog
  useEffect(() => {
    const allCompleted = tourSteps.every(step => step.completed)
    if (allCompleted && !showCongratulationsDialog) {
      setTimeout(() => {
        setShowCongratulationsDialog(true)
      }, 1000) // Wait 1 second after completion
    }
  }, [tourSteps, showCongratulationsDialog])


  const handleFinishTour = async () => {
    // Mark demo as complete
    try {
      await fetch('/api/mark_demo_complete', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking demo complete:', error);
    }
    
    router.push('/opportunities')
  }

  if (loading) {
    return (
      
      <div className="min-h-screen bg-gray-50">
        <Navigation /> 
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
            <span className="ml-3 text-gray-600">Loading tour...</span>
          </div>
        </div>
      </div>
    )
  }


  try {
    return (
      <ProtectedContent>

      <div className="min-h-screen bg-gray-50">
      <Navigation />
    
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Interactive Demo of The Niche</h1>
              <h4>try out the steps below to get a hang of some of the features on The Niche how to make the most of this network!</h4>
          <Alert className="mt-4 max-w-3xl mb-4 bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border border-yellow-200">
            <Megaphone className="h-5 w-5 text-orange-600" />
            <AlertDescription>
              <span className="text-neutral-700">
                You can always access this demo again later in your profile settings.
              </span>
            </AlertDescription>
        </Alert>
            </div>
            <Button
              onClick={handleFinishTour}
              variant="outline"
              className="text-gray-600 hover:text-gray-800"
            >
              Skip and Explore Yourself
            </Button>
          </div>
        </div>

        {/* Tour Steps */}
        <div className="space-y-12">
          {/* Opportunities Step */}
          <SlideInCard key="opportunities" slideDirection="right">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{tourSteps[0].title}</h2>
                    {tourSteps[0].completed && <CheckCircle className="w-6 h-6" />}
                  </div>
                  <p className="text-gray-600">{renderDescription(tourSteps[0].description)}</p>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="space-y-3">
                    {tourSteps[0].highlights.map((highlight, index) => {
                      const isAction = index < (tourSteps[0].actions?.length || 0)
                      const actionCompleted = isAction ? tourSteps[0].actions?.[index]?.completed : false
                      // Only non-actions after all actions are "tips" 
                      const isLastItem = !isAction && index >= (tourSteps[0].actions?.length || 0)
                      
                      // Define icons for each action
                      const getIcon = () => {
                        switch (index) {
                          case 0: return <Eye className="w-4 h-4" />
                          case 1: return <Send className="w-4 h-4" />
                          case 2: return <Repeat2 className="w-4 h-4" />
                          case 3: return <Send className="w-4 h-4" />
                          default: return <Eye className="w-4 h-4" />
                        }
                      }
                      
                      return (
                        <div key={index} className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isLastItem 
                              ? 'bg-gray-200 text-gray-500' 
                              : actionCompleted 
                                ? 'bg-gray-300 text-gray-600' 
                                : 'bg-gray-200 text-gray-500'
                          }`}>
                            {getIcon()}
                          </div>
                          <span className={`text-sm ${
                            isLastItem 
                              ? 'text-gray-600' 
                              : actionCompleted 
                                ? 'text-gray-500 line-through' 
                                : 'text-gray-700'
                          }`}>
                            {renderDescription(highlight)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                {selectedCompany ? (
                  <div
                    className="cursor-pointer" 
                    onClick={() => {
                      setShowCompanyDialog(true)
                      // Mark first action as completed when modal opens
                      markActionCompleted('opportunities', 'openModal')
                    }}
                  >
                    <CompanyCard 
                      company={selectedCompany} 
                      potential={selectedCompany.pending_partner} 
                      external={!selectedCompany.partner}
                      disableNavigation={true}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Loading company...
                  </div>
                )}
              </div>
            </Card>
          </SlideInCard>

          {/* Other Steps */}
          {tourSteps.slice(1).map((step, index) => {
            // Alternate slide direction: first additional card (index 0) slides from left, 
            // second (index 1) from right, etc.
            const slideDirection = index % 2 === 0 ? 'left' : 'right'
            
            return (
              <SlideInCard key={step.id} slideDirection={slideDirection}>
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
                        {step.completed && <CheckCircle className="w-6 h-6" />}
                      </div>
                      <p className="text-gray-600">{renderDescription(step.description)}</p>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="space-y-3">
                        {step.highlights.map((highlight, index) => {
                          const isAction = index < (step.actions?.length || 0)
                          const actionCompleted = isAction ? step.actions?.[index]?.completed : false
                          const isLastItem = index === step.highlights.length - 1
                          
                          // Define icons for ATS actions
                          const getIcon = () => {
                            if (isLastItem) return '💡'
                            switch (index) {
                              case 0: return <CheckCircle className="w-4 h-4" />
                              default: return <CheckCircle className="w-4 h-4" />
                            }
                          }
                          
                          return (
                            <div key={index} className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isLastItem 
                                  ? 'bg-gray-200 text-gray-500' 
                                  : actionCompleted 
                                    ? 'bg-gray-300 text-gray-600' 
                                    : 'bg-gray-200 text-gray-500'
                              }`}>
                                {getIcon()}
                              </div>
                              <span className={`text-sm ${
                                isLastItem 
                                  ? 'text-gray-600' 
                                  : actionCompleted 
                                    ? 'text-gray-500 line-through' 
                                    : 'text-gray-700'
                              }`}>
                                {renderDescription(highlight)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {/* Info alert */}
                    <Alert className="border-blue-200 bg-blue-50 mb-4">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription>
                        <strong>Track All Your Applications</strong> Forward, CC, or BCC interview emails to the address below to automatically track and update your applications&apos; status and progress.
                      </AlertDescription>
                    </Alert>

                    {/* Consent alert */}
                    {!acknowledged && (
                      <Alert className="mb-4">
                        <AlertDescription className="flex flex-col gap-2">
                          CCing my Niche-specific email will update my application status automatically and help me track my progress for processes both on and off The Niche. 
                          <Button
                            size="sm"
                            onClick={onAcknowledge}
                            className="self-start text-white"
                          >
                            Got it! 
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Tracking Email (blur/disable until acknowledged) */}
                    <div className={`${!acknowledged ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Forward or bcc interview emails to:
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={emailTracker}
                          readOnly
                          className="font-mono text-sm bg-gray-50 border-blue-200"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyEmail}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <Copy className="w-4 h-4" />
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </SlideInCard>
            )
          })}
        </div>
      </div>

      {/* Company Detail Dialog */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent className="max-w-none w-[95vw] h-[95vh] overflow-y-auto" style={{ width: '80vw', maxWidth: 'none' }}>
          <div className="max-h-full overflow-y-auto">
            {selectedCompany && (
              <CompanyPageClient 
                company={selectedCompany}
                companyPost={companyPost}
                isDemo={true}
                onIntroRequested={() => markActionCompleted('opportunities', 'requestIntro')}
                onRepost={() => markActionCompleted('opportunities', 'repost')}
                onShare={() => markActionCompleted('opportunities', 'share')}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Congratulations Dialog */}
      <Dialog open={showCongratulationsDialog} onOpenChange={setShowCongratulationsDialog}>
        <DialogContent className="max-w-md">
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
            <p className="text-gray-600 mb-6">
              Welcome to The Niche network!
              <br></br>
              <br></br>
              Our goal is to introduce you directly to opportunities and founders at some of the highest growth startups while helping you curate a personalized, professional network that aligns with your interests, skillsets, and verified by your existing professional community. 
              <br></br><br></br>
              <strong>We are so excited to do that for you!</strong>
            </p>
            <Button
              onClick={() => {
                setShowCongratulationsDialog(false)
                handleFinishTour()
              }}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-3 w-full"
            >
              Start
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
        </ProtectedContent>
    )
  } catch (error) {
    console.error("Rendering error in TourPage:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-600">Check the console for details</p>
        </div>
      </div>
    )
  }  
}