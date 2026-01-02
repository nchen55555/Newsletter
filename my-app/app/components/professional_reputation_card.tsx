'use client'

import { Card, CardHeader, CardDescription, CardTitle, CardAction, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import { ConnectionData } from "@/app/types"
import { useEffect, useState } from "react"

interface ProfessionalReputationCardProps {
  connections: ConnectionData[]
}

export function ProfessionalReputationCard({ connections }: ProfessionalReputationCardProps) {
  const [reputationSummary, setReputationSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Get connections with notes
  const connectionsWithNotes = connections.filter(conn => conn.note && conn.note.trim() !== '')
  const hasEnoughNotes = connectionsWithNotes.length >= 5

  // Calculate verified connections count
  // const totalCount = connections.length

  // Fetch reputation summary when there are enough notes
  useEffect(() => {
    if (!hasEnoughNotes) {
      setReputationSummary(null)
      return
    }

    const fetchReputationSummary = async () => {
      setIsLoading(true)
      try {
        const notes = connectionsWithNotes.map(conn => conn.note!).filter(Boolean)
        const response = await fetch('/api/summarize_reputation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notes }),
        })

        if (response.ok) {
          const data = await response.json()
          setReputationSummary(data.summary)
        }
      } catch (error) {
        console.error('Failed to fetch reputation summary:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReputationSummary()
  }, [hasEnoughNotes, connectionsWithNotes.length, connectionsWithNotes])

  // Show reputation summary if available
  if (hasEnoughNotes && reputationSummary) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>How Your Network Describes You</CardDescription>
          <CardTitle className="text-lg font-normal leading-relaxed @[250px]/card:text-xl">
            {isLoading ? 'Analyzing your network...' : reputationSummary}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Based on {connectionsWithNotes.length} Connection Notes
          </div>
        </CardFooter>
      </Card>
    )
  }

  // Show placeholder if not enough notes yet
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>Professional Reputation</CardDescription>
        <CardTitle className="text-xl font-normal leading-relaxed @[250px]/card:text-2xl">
          What Your Network Says About You
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="text-muted-foreground">
          {5 - connectionsWithNotes.length} more connections to unlock AI-powered reputation insights about your network and what others say about you
        </div>
        <div className="text-muted-foreground text-xs">
          {connectionsWithNotes.length} of 5 Connections with Notes
        </div>
      </CardFooter>
    </Card>
  )
}
