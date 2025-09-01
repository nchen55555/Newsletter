'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Plus, Building2, Target, CheckCircle } from "lucide-react"
import { Container } from "@/app/components/container"
import { Navigation } from "@/app/components/header"

interface Application {
  id: string
  company: string
  stage: string
  actionRequired: 'Yes' | 'No' | 'TBD'
  actionDetails: string
  dateAdded: Date
}

const STAGES = [
  "Applied",
  "Phone Screen",
  "Technical Interview", 
  "Onsite Interview",
  "Final Round",
  "Offer Received",
  "Rejected",
  "Withdrawn"
]

const ACTION_REQUIRED_OPTIONS = ['Yes', 'No', 'TBD'] as const

const ACTION_COLORS: Record<string, string> = {
  "Yes": "bg-red-100 text-red-800",
  "No": "bg-green-100 text-green-800",
  "TBD": "bg-yellow-100 text-yellow-800"
}

const STAGE_COLORS: Record<string, string> = {
  "Applied": "bg-blue-100 text-blue-800",
  "Phone Screen": "bg-yellow-100 text-yellow-800", 
  "Technical Interview": "bg-orange-100 text-orange-800",
  "Onsite Interview": "bg-purple-100 text-purple-800",
  "Final Round": "bg-indigo-100 text-indigo-800",
  "Offer Received": "bg-green-100 text-green-800",
  "Rejected": "bg-red-100 text-red-800",
  "Withdrawn": "bg-gray-100 text-gray-800"
}

export default function ATS() {
  const [applications, setApplications] = useState<Application[]>([
    {
      id: '1',
      company: 'Google',
      stage: 'Technical Interview',
      actionRequired: 'Yes',
      actionDetails: 'Prepare system design questions',
      dateAdded: new Date('2024-01-15')
    },
    {
      id: '2', 
      company: 'Meta',
      stage: 'Phone Screen',
      actionRequired: 'Yes',
      actionDetails: 'Schedule call with recruiter',
      dateAdded: new Date('2024-01-12')
    },
    {
      id: '3',
      company: 'Netflix',
      stage: 'Applied',
      actionRequired: 'No',
      actionDetails: '',
      dateAdded: new Date('2024-01-10')
    }
  ])

  type NewApplication = {
    company: string
    stage: typeof STAGES[number]
    actionRequired: typeof ACTION_REQUIRED_OPTIONS[number]
    actionDetails: string
  }
  
  const [newApplication, setNewApplication] = useState<NewApplication>({
    company: '',
    stage: 'Applied',
    actionRequired: 'No', // no `as const` here
    actionDetails: ''
  })

  const [actionFilter, setActionFilter] = useState<'All' | 'Yes' | 'No' | 'TBD'>('All')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const addApplication = () => {
    if (!newApplication.company.trim()) return

    const application: Application = {
      id: Date.now().toString(),
      company: newApplication.company.trim(),
      stage: newApplication.stage,
      actionRequired: newApplication.actionRequired,
      actionDetails: newApplication.actionDetails.trim(),
      dateAdded: new Date()
    }

    setApplications([application, ...applications])
    setNewApplication({ company: '', stage: 'Applied', actionRequired: 'TBD', actionDetails: '' })
    setIsDialogOpen(false)
  }

  const removeApplication = (id: string) => {
    setApplications(applications.filter(app => app.id !== id))
  }

  const updateApplication = (id: string, field: keyof Application, value: string | Application['actionRequired']) => {
    setApplications(applications.map(app => 
      app.id === id ? { ...app, [field]: value } : app
    ))
  }

  // Filter and sort applications
  const filteredAndSortedApplications = applications
    .filter(app => actionFilter === 'All' || app.actionRequired === actionFilter)
    .sort((a, b) => {
      // Sort by action required priority: Yes > TBD > No
      const actionPriority = { 'Yes': 3, 'TBD': 2, 'No': 1 }
      const priorityDiff = actionPriority[b.actionRequired] - actionPriority[a.actionRequired]
      if (priorityDiff !== 0) return priorityDiff
      
      // Then sort by date (newest first)
      return b.dateAdded.getTime() - a.dateAdded.getTime()
    })

  const getStageStats = () => {
    const stats = applications.reduce((acc, app) => {
      acc[app.stage] = (acc[app.stage] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return stats
  }

  const stats = getStageStats()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <Container>
        <div className="pt-12 pb-16">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Application Tracking System</h1>
            <p className="text-neutral-600">Track your job applications and stay organized</p>
          </div>

          {/* Stats Cards */}
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
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">%</span>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {applications.length > 0 
                        ? Math.round(((stats['Offer Received'] || 0) / applications.length) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>



          {/* Applications Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Applications ({filteredAndSortedApplications.length})</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-600">Filter by action:</span>
                    <Select value={actionFilter} onValueChange={(value: 'All' | 'Yes' | 'No' | 'TBD') => setActionFilter(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="TBD">TBD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Application
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Add New Application</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <label htmlFor="company" className="text-sm font-medium">
                            Company Name
                          </label>
                          <Input
                            id="company"
                            placeholder="Enter company name"
                            value={newApplication.company}
                            onChange={(e) => setNewApplication({...newApplication, company: e.target.value})}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <label htmlFor="stage" className="text-sm font-medium">
                            Current Stage
                          </label>
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
                        </div>
                        
                        <div className="grid gap-2">
                          <label htmlFor="action" className="text-sm font-medium">
                            Action Required
                          </label>
                          <Select
                            value={newApplication.actionRequired}
                            onValueChange={(value: 'Yes' | 'No' | 'TBD') => setNewApplication({...newApplication, actionRequired: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ACTION_REQUIRED_OPTIONS.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {newApplication.actionRequired === 'Yes' && (
                          <div className="grid gap-2">
                            <label htmlFor="actionDetails" className="text-sm font-medium">
                              Action Details
                            </label>
                            <Input
                              id="actionDetails"
                              placeholder="What needs to be done?"
                              value={newApplication.actionDetails}
                              onChange={(e) => setNewApplication({...newApplication, actionDetails: e.target.value})}
                            />
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={addApplication} disabled={!newApplication.company.trim()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Application
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAndSortedApplications.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{applications.length === 0 ? 'No applications yet. Add your first application above!' : 'No applications match the current filter.'}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Action Required</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <Input
                            value={app.company}
                            onChange={(e) => updateApplication(app.id, 'company', e.target.value)}
                            className="border-0 p-0 h-auto font-medium"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={app.stage}
                            onValueChange={(value) => updateApplication(app.id, 'stage', value)}
                          >
                            <SelectTrigger className="border-0 p-0 h-auto">
                              <Badge className={STAGE_COLORS[app.stage] || "bg-gray-100 text-gray-800"}>
                                {app.stage}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {STAGES.map(stage => (
                                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={app.actionRequired}
                              onValueChange={(value: 'Yes' | 'No' | 'TBD') => updateApplication(app.id, 'actionRequired', value)}
                            >
                              <SelectTrigger className="border-0 p-0 h-auto w-auto">
                                <Badge className={ACTION_COLORS[app.actionRequired] || "bg-gray-100 text-gray-800"}>
                                  {app.actionRequired}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {ACTION_REQUIRED_OPTIONS.map(option => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {app.actionRequired === 'Yes' && (
                              <Input
                                value={app.actionDetails}
                                onChange={(e) => updateApplication(app.id, 'actionDetails', e.target.value)}
                                className="border-0 p-0 h-auto text-sm"
                                placeholder="What needs to be done?"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-neutral-500 text-sm">
                          {app.dateAdded.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeApplication(app.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  )
}