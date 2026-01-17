'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProfileFormState, ProfileData } from '@/app/types'
import { PeopleSearch } from './people-search'
import { ReferralDialog } from './referral-dialog'
import { useRouter } from 'next/navigation'

type StepId = 'overview' | 'networking' | 'referrals'

interface ProfileOnboardingProps {
  form: ProfileFormState
  onComplete?: (isComplete: boolean) => Promise<void> | void
  /**
   * Optional initial step index (0 = overview, 1 = networking, 2 = referrals)
   */
  initialStep?: number
}

export default function ProfileOnboarding({
  form,
  onComplete,
  initialStep = 0,
}: ProfileOnboardingProps) {
  const router = useRouter()

  const steps: { id: StepId; label: string }[] = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'networking', label: 'Network' },
      { id: 'referrals', label: 'Referrals' },
    ],
    []
  )

  const [currentStepIndex, setCurrentStepIndex] = useState(() =>
    Math.min(Math.max(initialStep, 0), steps.length - 1)
  )

  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [currentUserData, setCurrentUserData] = useState<ProfileData | null>(null)
  const [showReferralDialog, setShowReferralDialog] = useState(false)
  const [userReferralsCount, setUserReferralsCount] = useState(0)

  const currentStep = steps[currentStepIndex]
  const isLastStep = currentStepIndex === steps.length - 1
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const networkingConnectionsCount =
    currentUserData && Array.isArray(currentUserData.pending_connections_new)
      ? currentUserData.pending_connections_new.length
      : 0
  const canShowNextButton =
    (currentStep.id !== 'networking' || networkingConnectionsCount >= 1) && (currentStep.id !== 'referrals' || userReferralsCount >= 2) && (currentStep.id !== 'overview')

  // --- Data loading helpers ---

  const loadProfilesAndUser = async () => {
    setLoadingProfiles(true)

    const loadProfiles = async () => {
      try {
        const response = await fetch('/api/get_cohort', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setAllProfiles(data.profiles || [])
        } else {
          setAllProfiles([])
        }
      } catch {
        setAllProfiles([])
      }
    }

    const loadUser = async () => {
      try {
        const response = await fetch('/api/get_profile', { credentials: 'include' })
        if (response.ok) {
          const userData = await response.json()
          setCurrentUserData(userData)
        } else {
          setCurrentUserData(null)
        }
      } catch {
        setCurrentUserData(null)
      }
    }

    await Promise.all([loadProfiles(), loadUser()])
    setLoadingProfiles(false)
  }

  const loadUserReferrals = async () => {
    fetch(`/api/get_user_referrals?user_id=${form.id}`, {
      credentials: 'include',
    })
      .then((response) => {
        if (response.ok) return response.json()
        throw new Error('Failed to load referrals')
      })
      .then((data) => {
        setUserReferralsCount(data.length || 0)
      })
      .catch(() => {
        setUserReferralsCount(0)
      })
  }

  // Lazy-load data only when the relevant step is reached
  useEffect(() => {
    if (currentStep.id === 'networking' && allProfiles.length === 0) {
      loadProfilesAndUser()
    }
    if (currentStep.id === 'referrals') {
      loadUserReferrals()
    }
  }, [currentStep.id])

  // --- Navigation helpers ---

  const goToStep = (index: number) => {
    setCurrentStepIndex(Math.min(Math.max(index, 0), steps.length - 1))
  }

  const goNext = async () => {
    const nextIndex = currentStepIndex + 1
    const completing = nextIndex >= steps.length

    if (completing) {
      if (onComplete) {
        await onComplete(true)
      }
      router.push('/opportunities?flow=introduction')
    } else {
      setCurrentStepIndex(nextIndex)
      if (onComplete) {
        onComplete(false)
      }
    }
  }

  // --- UI blocks for each step ---

  const renderOverview = () => {
    return (
      <div className="space-y-6 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-neutral-200">
          Welcome to Your Niche Profile
        </h1>
        <p className="text-lg text-neutral-400">
          Curate a professional network of your most trusted contacts, and unlock warm intros to opportunities they&apos;ve validated. We surface personalized opportunities based on your network&apos;s activity and warm intro you direct on the platform. Two steps to onboard. 
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button
            onClick={goNext}
            className="px-8 py-3 text-lg bg-neutral-900 hover:bg-neutral-800 text-white"
            size="lg"
          >
            Get started
          </Button>
        </div>
      </div>
    )
  }

  const renderNetworking = () => {
    return (
      <div className="w-full">
        <div className="mb-6 text-center space-y-2">
          <h2 className="text-3xl font-semibold text-neutral-200">
            Curate Your Niche Network
          </h2>
          <p className="text-neutral-400 max-w-4xl mx-auto">
            Add 2 to 3 people who best represent your work and trajectory. It&apos;s in your best interest to only add people who you trust and would like to index your career trajectory on as we use network-driven personalization to surface opportunities for you.
          </p>
        </div>
        <PeopleSearch
          allProfiles={allProfiles}
          currentUserData={currentUserData}
          loadingProfiles={loadingProfiles}
          currentUserId={form.id}
          onConnectionUpdate={() => {
            loadProfilesAndUser()
          }}
        />
      </div>
    )
  }

  const renderReferrals = () => {
    return (
      <div className="space-y-8 text-center max-w-4xl mx-auto">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-neutral-200">
            Recommend 2 to 3 of Your Smartest Friends
          </h2>
          <p className="text-neutral-400">
            Grow your network by inviting more people who you trust and would like to index your career trajectory on. Referrals strengthen your own
            reputation and grow your network of warm intros and opportunities. 
          </p>
        </div>

        <Button
          onClick={() => setShowReferralDialog(true)}
          className="px-8 py-3 text-lg bg-neutral-900 hover:bg-neutral-800 text-white"
          size="lg"
        >
          Refer
        </Button>

        {userReferralsCount > 0 && (
          <div className="rounded-lg p-4 border border-neutral-800 text-sm text-neutral-300">
            {userReferralsCount} recommendation{userReferralsCount === 1 ? '' : 's'} submitted
          </div>
        )}

        <ReferralDialog
          open={showReferralDialog}
          onOpenChange={(open) => {
            setShowReferralDialog(open)
            if (!open) {
              loadUserReferrals()
            }
          }}
          title="Recommend a Friend to The Niche"
          description="Help us grow our network by recommending your smartest technical friends."
          forceFormMode={true}
          allowClose={true}
        />
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'overview':
        return renderOverview()
      case 'networking':
        return renderNetworking()
      case 'referrals':
        return renderReferrals()
      default:
        return null
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* Progress + step pills */}
      <div className="w-full px-8 mb-8">
        <div className="grid grid-cols-3 items-center mb-4">
          {/* Left: step description + skip */}
          <div className="flex items-center gap-3">
            <div className="text-sm text-neutral-400">3 steps</div>
            <button
              type="button"
              onClick={() => router.push('/opportunities?flow=introduction')}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              [skip onboarding]
            </button>
          </div>

          {/* Center: step tags, truly centered in the page */}
          <div className="flex justify-center">
            <div className="flex items-center gap-4 text-xs text-neutral-400">
              {steps.map((step, index) => {
                const isActive = index === currentStepIndex
                const isCompleted = index < currentStepIndex
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`transition-colors underline-offset-2 ${
                      isActive
                        ? 'text-neutral-100'
                        : isCompleted
                        ? 'text-neutral-300'
                        : 'text-neutral-500'
                    }`}
                  >
                    [{step.label}]
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right: Next / Finish */}
          <div className="flex justify-end">
            {canShowNextButton && (
              <Button
                onClick={goNext}
                variant="ghost"
                className="flex items-center gap-2 p-0 text-neutral-200 hover:text-neutral-700"
              >
                {isLastStep ? '[Activate Profile]' : '[Next]'}
              </Button>
            )}
          </div>
        </div>

        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
          <div
            className="bg-neutral-900 dark:bg-neutral-100 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex items-center mx-auto w-full px-8 pb-8">
        {renderStepContent()}
      </div>
    </div>
  )
}


