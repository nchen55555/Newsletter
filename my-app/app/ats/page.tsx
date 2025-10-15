'use client'
import { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Trash2, 
  Plus, 
  Building2, 
  Target, 
  CheckCircle, 
  Copy, 
  AlertCircle,
  Forward,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Navigation } from "@/app/components/header";
import { debounce } from "@/app/utils/debounce"

// Types
interface Application {
  id: string
  company: string
  stage: string
  actionRequired: 'Yes' | 'No' | 'TBD'
  actionDetails: string
  dateAdded: Date
  lastEmailUpdate?: Date
  emailConfidence?: number
}

// Constants
const STAGES = [
  "Applied", "Phone Screen", "Technical Interview", 
  "Onsite Interview", "Final Round", "Offer Received",
  "Offer Accepted", "Offer Declined", "Rejected", "Withdrawn"
]

const ACTION_REQUIRED_OPTIONS = ['Yes', 'No', 'TBD'] as const

const ACTION_COLORS: Record<string, string> = {
  "Yes": "bg-red-100 text-red-800",
  "No": "bg-green-100 text-green-800", 
  "TBD": "bg-yellow-100 text-yellow-800"
}

// Email Forwarding Setup Component
function EmailForwardingSetup({ 
  trackingEmail, 
  acknowledged, 
  onAcknowledge,
}: { trackingEmail: string; acknowledged: boolean; onAcknowledge: () => void }) {
  const [copied, setCopied] = useState(false)
  
  const copyEmail = async () => {
    await navigator.clipboard.writeText(trackingEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Forward className="w-5 h-5 text-blue-600" />
          Email Forwarding Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <strong>Track All Your Applications</strong> Forward, CC, or BCC interview emails to the address below to automatically track and update your applications&apos; status and progress.
          </AlertDescription>
        </Alert>

        {/* Consent alert */}
        {!acknowledged && (
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertDescription className="flex flex-col gap-2">
              CC your Niche-specific email for processes both on and off The Niche to get better recommendations!
              <Button 
                size="sm" 
                onClick={onAcknowledge} 
                className="self-start bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                I Understand
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tracking Email (blurred/disabled until acknowledged) */}
        <div className={`${!acknowledged ? 'opacity-50 pointer-events-none select-none' : ''}`}>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Forward or bcc interview emails to:
          </label>
          <div className="flex items-center gap-2">
            <Input 
              value={trackingEmail}
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

      </CardContent>
    </Card>
  )
}

// Main ATS Component
function EmailForwardingATSContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [actionFilter, setActionFilter] = useState<'All' | 'Yes' | 'No' | 'TBD'>('All')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEmailSetupDialogOpen, setIsEmailSetupDialogOpen] = useState(false)
  const [trackingEmail, setTrackingEmail] = useState<string>('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [showLoadingMessage, setShowLoadingMessage] = useState(false)
  
  const [newApplication, setNewApplication] = useState({
    company: '',
    stage: 'Applied',
    actionRequired: 'No' as const,
    actionDetails: '',
    isOnTheNiche: false
  })

  const abortControllersRef = useRef<Record<string, AbortController>>({})

  const addApplication = () => {    
    // If it's on The Niche, redirect to opportunities page
    if (newApplication.isOnTheNiche) {
      setIsAddDialogOpen(false)
      router.push('/opportunities')
      return
    }

    if (!newApplication.company.trim()) return

  
    const tempId = `tmp_${Date.now()}`
    const optimistic: Application = {
      id: tempId,
      company: newApplication.company.trim(),
      stage: newApplication.stage,
      actionRequired: newApplication.actionRequired,
      actionDetails: newApplication.actionDetails.trim(),
      dateAdded: new Date(),
    }
    setApplications(prev => [optimistic, ...prev])
    setNewApplication({ company: '', stage: 'Applied', actionRequired: 'No', actionDetails: '', isOnTheNiche: false })
    setIsAddDialogOpen(false)
  
    autosave(optimistic)
  }

  const removeApplication = (id: string) => {
    setApplications(applications.filter(app => app.id !== id))
  }

  const autosave = (app: Application) => {
    const prev = abortControllersRef.current[app.id]
    if (prev) prev.abort()
  
    const ctrl = new AbortController()
    abortControllersRef.current[app.id] = ctrl
  
    fetch("/api/update_application", {
      method: "POST",
      credentials: "include", 
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        id: app.id,
        company_name: app.company,
        stage: app.stage,
        action_required: app.actionRequired,
        action_required_description: app.actionDetails,
        date_added: app.dateAdded?.toISOString?.(),
      }),
    })
    .then(res => res.json())
    .then((data) => {
      if (data?.application?.id && data.application.id !== app.id) {
        setApplications(curr =>
          curr.map(a => (a.id === app.id ? { ...a, id: String(data.application.id) } : a))
        )
      }
    })
    .catch((e) => {
      if (e?.name === "AbortError") return
      console.error("Autosave failed", e)
    })
  }
  
  const debouncedAutosave = useMemo(() => debounce(autosave, 600), [])
  
  const updateApplication = <K extends keyof Application>(
  id: string,
  field: K,
  value: Application[K]
  ) => {
    setApplications(prev => {
      const next = prev.map(app =>
        app.id === id ? { ...app, [field]: value } : app
      );
      const updated = next.find(a => a.id === id);
      if (updated) debouncedAutosave(updated);
      return next;
    });
  };

  const filteredApplications = applications
    .filter(app => actionFilter === 'All' || app.actionRequired === actionFilter)
    .sort((a, b) => {
      const actionPriority = { 'Yes': 3, 'TBD': 2, 'No': 1 }
      const priorityDiff = actionPriority[b.actionRequired] - actionPriority[a.actionRequired]
      if (priorityDiff !== 0) return priorityDiff
      return b.dateAdded.getTime() - a.dateAdded.getTime()
    })

  const stats = applications.reduce((acc, app) => {
    acc[app.stage] = (acc[app.stage] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Check for loading parameter from apply redirect
  useEffect(() => {
    const loading = searchParams.get('loading')
    if (loading === 'true') {
      setShowLoadingMessage(true)
      // Hide loading message after 3 seconds and transition to ATS
      const timer = setTimeout(() => {
        setShowLoadingMessage(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  // Check if user has already confirmed application tracker setup
  useEffect(() => {
    const checkProfileConfirmation = async () => {
      try {
        const res = await fetch('/api/get_profile', { credentials: 'include' });
        if (res.ok) {
          const profile = await res.json();
          const isConfirmed = profile.application_tracker_confirmed || false;
          setAcknowledged(isConfirmed);
          setProfileLoaded(true);
        }
      } catch (error) {
        console.error('Error checking profile confirmation:', error);
        setProfileLoaded(true); // Allow the component to continue functioning
      }
    };

    checkProfileConfirmation();
  }, []);

  useEffect(() => {
  fetch("/api/get_all_applications", { credentials: "include" })
    .then(res => res.json())
    .then(data => {
      type ApiApplication = {
        id: string | number
        company: { company_name: string }
        stage?: string
        action_required?: "Yes" | "No" | "TBD"
        action_required_description?: string
        date_added?: string
        last_email_update?: string
        email_confidence?: number
      }

      const mapped: Application[] = (data.applications ?? []).map((app: ApiApplication) => ({
        id: String(app.id),
        company: String(app.company.company_name),
        stage: app.stage ?? "",
        actionRequired: app.action_required ?? "TBD",
        actionDetails: app.action_required_description ?? "",
        dateAdded: app.date_added ? new Date(app.date_added) : new Date(),
        lastEmailUpdate: app.last_email_update ? new Date(app.last_email_update) : undefined,
        emailConfidence: app.email_confidence,
      }))

      setApplications(mapped)
      setTrackingEmail(data.tracking_email)
    })
    .catch(err => console.error("Error fetching applications", err))
}, [])

  // Open the Email Setup dialog on initial load once we have the trackingEmail
  useEffect(() => {
    if (trackingEmail && !acknowledged && profileLoaded) {
      setIsEmailSetupDialogOpen(true)
    }
  }, [trackingEmail, acknowledged, profileLoaded])

  // Show loading message like opportunities page
  if (showLoadingMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
        <Navigation />
        <div className="pt-12 pb-8 px-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="animate-in fade-in-50 duration-700">
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-sm font-medium text-neutral-700">Loading your application(s)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <div className="pt-12 pb-8 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-8">
              {/* Welcome Header */}
              <div className="text-center pt-16 pb-8">
                <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-black">
                  Your Application Tracker
                </h1>
                <p className="text-lg md:text-xl text-neutral-500 leading-relaxed font-light max-w-3xl mx-auto mb-8">
                  Track any application process. Forward, BCC, or CC interview emails to update your progress for processes both on and off The Niche. Every introduction with a Niche company will have your Niche-specific email already CC&apos;d on the email exchange. 
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEmailSetupDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Forward className="w-4 h-4" />
                  Email Setup
                </Button>
              </div>

              {/* Email Setup Dialog (opens on load if not acknowledged) */}
              <Dialog open={isEmailSetupDialogOpen} onOpenChange={setIsEmailSetupDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Email Forwarding Setup</DialogTitle>
                  </DialogHeader>
                  <EmailForwardingSetup 
                    trackingEmail={trackingEmail} 
                    acknowledged={acknowledged} 
                    onAcknowledge={async () => {
                      try {
                        const res = await fetch('/api/post_ats_track', {
                          method: 'POST',
                          credentials: 'include'
                        });
                        
                        if (res.ok) {
                          setAcknowledged(true);
                          setIsEmailSetupDialogOpen(false);
                        } else {
                          console.error('Failed to update application tracker confirmation');
                        }
                      } catch (error) {
                        console.error('Error updating application tracker confirmation:', error);
                      }
                    }} 
                  />
                </DialogContent>
              </Dialog>

              {/* If not acknowledged, show a soft gate message */}
              {!acknowledged && (
                <Card className="mb-8 w-full max-w-4xl">
                  <CardContent className="py-6">
                    <p className="text-sm text-neutral-700">
                      Please open <strong>Email Setup</strong> and click <em>I Understand</em> to enable the tracker.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Stats Cards */}
              {acknowledged && (
                <div className="flex justify-center mb-8 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-8 h-8 text-blue-600" />
                          <div>
                            <p className="text-sm text-neutral-600">Total Applications</p>
                            <p className="text-2xl font-bold">{applications.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Target className="w-8 h-8 text-orange-600" />
                          <div>
                            <p className="text-sm text-neutral-600">In Progress</p>
                            <p className="text-2xl font-bold">
                              {applications.filter(app => !['Rejected', 'Withdrawn', 'Offer Received'].includes(app.stage)).length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                          <div>
                            <p className="text-sm text-neutral-600">Offers</p>
                            <p className="text-2xl font-bold">{stats['Offer Received'] || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Applications Table */}
              {acknowledged && (
                <Card className="w-full max-w-6xl">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Your Applications ({filteredApplications.length})</CardTitle>
                      <div className="flex items-center gap-4">
                        <Select value={actionFilter} onValueChange={(value: 'All' | 'Yes' | 'No' | 'TBD') => setActionFilter(value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All</SelectItem>
                            <SelectItem value="Yes">Action Required</SelectItem>
                            <SelectItem value="No">No Action</SelectItem>
                            <SelectItem value="TBD">To Be Determined</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Application
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Application</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <Input
                                placeholder="Company Name"
                                value={newApplication.company}
                                onChange={(e) => setNewApplication({...newApplication, company: e.target.value})}
                              />
                              
                              {/* Toggle for Application on/off The Niche */}
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="niche-toggle"
                                  checked={newApplication.isOnTheNiche}
                                  onCheckedChange={(checked) => setNewApplication({...newApplication, isOnTheNiche: checked})}
                                />
                                <Label htmlFor="niche-toggle" className="text-sm font-medium">
                                  Application on The Niche
                                </Label>
                              </div>
                              
                              {newApplication.isOnTheNiche && (
                                <Alert className="border-blue-200 bg-blue-50">
                                  <AlertCircle className="h-4 w-4 text-blue-600" />
                                  <AlertDescription className="text-blue-700">
                                    You&apos;ll be redirected to the opportunities page to find and apply to this company.
                                  </AlertDescription>
                                </Alert>
                              )}
                              
                              {!newApplication.isOnTheNiche && (
                                <>
                                  <Select
                                    value={newApplication.stage}
                                    onValueChange={(value) => setNewApplication({...newApplication, stage: value})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {STAGES.map(stage => (
                                        <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="Action details (optional)"
                                    value={newApplication.actionDetails}
                                    onChange={(e) => setNewApplication({...newApplication, actionDetails: e.target.value})}
                                  />
                                </>
                              )}
                              
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={addApplication}>
                                  {newApplication.isOnTheNiche ? 'Go to Opportunities' : 'Add Application'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredApplications.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500">
                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No applications yet. Add your first application above!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Table Header */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 border-b-2 border-neutral-200 font-semibold text-sm text-neutral-700">
                          <div className="flex-grow grid gap-4" style={{gridTemplateColumns: '1fr 1fr 2.5fr 0.8fr'}}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-transparent flex-shrink-0" />
                              <span>Company</span>
                            </div>
                            <div>Stage</div>
                            <div>Action Required</div>
                            <div>Date Added</div>
                          </div>
                          <div className="w-10 ml-4"></div> {/* Space for delete button */}
                        </div>
                        {filteredApplications.map((app) => (
                          <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-grow grid gap-4" style={{gridTemplateColumns: '1fr 1fr 2.5fr 0.8fr'}}>
                              <div className="min-w-0 flex items-center gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div 
                                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                          app.emailConfidence && app.emailConfidence >= 0.7 
                                            ? 'bg-green-500' 
                                            : 'bg-yellow-500'
                                        }`}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {app.emailConfidence && app.emailConfidence >= 0.7
                                          ? 'Verified by email setup'
                                          : 'Changes not verified by email setup or email setup produced low confidence'
                                        }
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <Input
                                  value={app.company}
                                  onChange={(e) => updateApplication(app.id, 'company', e.target.value)}
                                  className="font-medium flex-grow"
                                />
                              </div>
                              <div className="min-w-0">
                                <Select
                                  value={app.stage}
                                  onValueChange={(value) => updateApplication(app.id, 'stage', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STAGES.map(stage => (
                                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="min-w-0 flex gap-3">
                                <div className="min-w-0 flex-shrink-0">
                                  <Select
                                    value={app.actionRequired}
                                    onValueChange={(value: 'Yes' | 'No' | 'TBD') => updateApplication(app.id, 'actionRequired', value)}
                                  >
                                    <SelectTrigger className="w-20">
                                      <Badge className={ACTION_COLORS[app.actionRequired]}>
                                        {app.actionRequired}
                                      </Badge>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ACTION_REQUIRED_OPTIONS.map(option => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="min-w-0 flex-grow">
                                  <Input
                                    value={app.actionDetails}
                                    onChange={(e) => updateApplication(app.id, 'actionDetails', e.target.value)}
                                    placeholder="Action details..."
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                              <div className="text-sm text-gray-500 min-w-0 flex flex-col justify-center">
                                <div>{app.dateAdded.toLocaleDateString()}</div>
                                {app.lastEmailUpdate && (
                                  <div className="text-xs text-green-600">
                                    📧 {app.lastEmailUpdate.toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeApplication(app.id)}
                              className="text-red-600 hover:text-red-800 ml-4"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}

// Wrapper component with Suspense boundary
export default function EmailForwardingATS() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
        <Navigation />
        <div className="pt-12 pb-8 px-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="animate-in fade-in-50 duration-700">
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-sm font-medium text-neutral-700">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <EmailForwardingATSContent />
    </Suspense>
  )
}
