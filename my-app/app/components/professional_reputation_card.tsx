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


  // Fetch reputation summary when there are enough notes, with simple local cache
  useEffect(() => {
    if (!hasEnoughNotes) {
      setReputationSummary(null)
      return
    }

    // Don't refetch if we already have a summary in state
    if (reputationSummary) {
      return
    }

    const notes = connectionsWithNotes.map(conn => conn.note!).filter(Boolean)
    if (notes.length === 0) return

    const notesKey = notes.join("||")
    const cacheKey = "professionalReputationSummary"

    // Try to read from localStorage cache first
    if (typeof window !== "undefined") {
      try {
        const cachedRaw = window.localStorage.getItem(cacheKey)
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as {
            summary: string
            notesKey: string
            timestamp: number
          }

          // Optional TTL: 24 hours
          const oneDayMs = 24 * 60 * 60 * 1000
          const isFresh = Date.now() - cached.timestamp < oneDayMs

          if (cached.notesKey === notesKey && isFresh) {
            setReputationSummary(cached.summary)
            return
          }
        }
      } catch {
        // Ignore cache errors and fall back to network
      }
    }

    const fetchReputationSummary = async () => {
      setIsLoading(true)
      try {
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

          // Write to cache for future mounts in this browser
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(
                cacheKey,
                JSON.stringify({
                  summary: data.summary,
                  notesKey,
                  timestamp: Date.now(),
                }),
              )
            } catch {
              // Ignore storage failures
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch reputation summary:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReputationSummary()
  }, [hasEnoughNotes, connectionsWithNotes.length, reputationSummary])

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
            {(isLoading || !reputationSummary) ? 'Analyzing your network...' : reputationSummary}
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
