'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
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
  Mail, 
  Copy, 
  AlertCircle,
  Forward,
  ArrowRight
} from "lucide-react"
import {Container} from "@/app/components/container"
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
            <strong>Simple setup:</strong> Forward or bcc interview emails to the address below and your tracker updates automatically.
          </AlertDescription>
        </Alert>

        {/* Consent alert */}
        {!acknowledged && (
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="flex flex-col gap-2">
              We use your application tracker to better understand your interests and produce better matches.
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

        {/* Instructions */}
        <div className={`bg-blue-50 p-4 rounded-lg space-y-3 ${!acknowledged ? 'opacity-50 pointer-events-none select-none' : ''}`}>
          <h3 className="font-semibold text-blue-800">How to use:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
              <span>Receive an interview-related email</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
              <span>Click &quot;Forward&quot; or &quot;Bcc&quot; in your email client</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
              <span>Enter <code className="bg-blue-100 px-1 rounded">{trackingEmail}</code> as the recipient</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
              <span>Send — your application tracker updates automatically!</span>
            </div>
          </div>
        </div>

        {/* Visual Flow */}
        <div className={`border-t pt-4 ${!acknowledged ? 'opacity-50 pointer-events-none select-none' : ''}`}>
          <h3 className="font-semibold mb-3">Email Flow:</h3>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="text-center">
              <Mail className="w-8 h-8 mx-auto mb-1 text-green-500" />
              <div>Interview Email</div>
            </div>
            <ArrowRight className="w-4 h-4" />
            <div className="text-center">
              <Forward className="w-8 h-8 mx-auto mb-1 text-blue-500" />
              <div>Forward</div>
            </div>
            <ArrowRight className="w-4 h-4" />
            <div className="text-center">
              <Mail className="w-8 h-8 mx-auto mb-1 text-purple-500" />
              <div>Tracking Email</div>
            </div>
            <ArrowRight className="w-4 h-4" />
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-1 text-orange-500" />
              <div>Auto-Update</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main ATS Component
export default function EmailForwardingATS() {
  const [applications, setApplications] = useState<Application[]>([])
  const [actionFilter, setActionFilter] = useState<'All' | 'Yes' | 'No' | 'TBD'>('All')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEmailSetupDialogOpen, setIsEmailSetupDialogOpen] = useState(false)
  const [trackingEmail, setTrackingEmail] = useState<string>('')
  const [acknowledged, setAcknowledged] = useState(false)
  
  const [newApplication, setNewApplication] = useState({
    company: '',
    stage: 'Applied',
    actionRequired: 'No' as const,
    actionDetails: ''
  })

  const abortControllersRef = useRef<Record<string, AbortController>>({})

  const addApplication = () => {
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
    setNewApplication({ company: '', stage: 'Applied', actionRequired: 'No', actionDetails: '' })
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
    if (trackingEmail && !acknowledged) {
      setIsEmailSetupDialogOpen(true)
    }
  }, [trackingEmail, acknowledged])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <div className="pt-12 pb-8 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
        <Container className="max-w-4xl mx-auto">
          <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
              
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  Application Tracking System
                </h1>
                <p className="text-neutral-600 mb-4">
                  Track your job applications with AI-powered email parsing. 
                  Forward interview emails to automatically update your progress.
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
                    onAcknowledge={() => {
                      setAcknowledged(true)
                      setIsEmailSetupDialogOpen(false)
                    }} 
                  />
                </DialogContent>
              </Dialog>

              {/* If not acknowledged, show a soft gate message */}
              {!acknowledged && (
                <Card className="mb-8">
                  <CardContent className="py-6">
                    <p className="text-sm text-neutral-700">
                      Please open <strong>Email Setup</strong> and click <em>I Understand</em> to enable the tracker.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Stats Cards */}
              {acknowledged && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Forward className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="text-sm text-neutral-600">Email Updates</p>
                          <p className="text-2xl font-bold">
                            {applications.filter(app => app.lastEmailUpdate).length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Applications Table */}
              {acknowledged && (
                <Card>
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
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={addApplication}>Add Application</Button>
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
        </Container>
      </div>
    </div>
  )
}
