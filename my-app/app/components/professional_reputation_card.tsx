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


  // Fetch reputation summary when there are enough notes
  useEffect(() => {
    if (!hasEnoughNotes) {
      setReputationSummary(null)
      return
    }

    // Don't fetch if we already have a summary
    if (reputationSummary) {
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
  }, [hasEnoughNotes, connectionsWithNotes.length])

  // Show reputation summary if available
  if (hasEnoughNotes) {
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
              Visible Only To You
            </Badge>
          </CardAction>
        </CardHeader>
        <div className="text-sm text-muted-foreground px-8">
            {isLoading ? 'Analyzing your network...' : reputationSummary}
          </div>
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
            Visible Only To You
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
