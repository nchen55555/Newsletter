import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get current user's profile
    const { data: currentUser, error: userError } = await supabase
      .from('subscribers')
      .select('connections_new, pending_connections_new, requested_connections_new')
      .eq('email', session.user.email)
      .single()

    if (userError) throw userError
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Collect connection info with type, rating, and notes
    type ConnectionType = 'verified' | 'pending' | 'requested'
    type ConnectionInfo = {
      type: ConnectionType
      rating?: number
      note?: string
    }
    const connectionInfoMap = new Map<number, ConnectionInfo>()
    const weightMap: Record<ConnectionType, number> = {
      verified: 1,
      pending: 0.2,
      requested: 0.4
    }

    // Add verified connections (weight: 1)
    if (currentUser.connections_new && Array.isArray(currentUser.connections_new)) {
      currentUser.connections_new.forEach((conn: { connect_id: number; rating?: number; note?: string }) => {
        connectionInfoMap.set(conn.connect_id, {
          type: 'verified',
          rating: conn.rating,
          note: conn.note
        })
      })
    }

    // Add pending connections (weight: 0.2)
    if (currentUser.pending_connections_new && Array.isArray(currentUser.pending_connections_new)) {
      currentUser.pending_connections_new.forEach((conn: { connect_id: number; rating?: number; note?: string }) => {
        connectionInfoMap.set(conn.connect_id, {
          type: 'pending',
          rating: conn.rating,
          note: conn.note
        })
      })
    }

    // Add requested connections (weight: 0.4)
    if (currentUser.requested_connections_new && Array.isArray(currentUser.requested_connections_new)) {
      currentUser.requested_connections_new.forEach((conn: { connect_id: number; rating?: number; note?: string }) => {
        connectionInfoMap.set(conn.connect_id, {
          type: 'requested',
          rating: conn.rating,
          note: conn.note
        })
      })
    }

    // If no connections, return empty object
    if (connectionInfoMap.size === 0) {
      return NextResponse.json({ companies: {} })
    }

    const connectionIds = Array.from(connectionInfoMap.keys())

    // Fetch bookmarked companies for all connections
    const { data: connections, error: connectionsError } = await supabase
      .from('subscribers')
      .select('id, first_name, last_name, bookmarked_companies')
      .in('id', connectionIds)

    if (connectionsError) throw connectionsError

    // Aggregate company IDs with both quantity and quality scores
    const companyMap = new Map<number, {
      connectionCount: number
      connections: Array<{ id: number; name: string }>
      quantity_score: number
      quality_scores: number[]
      warm_intro_possible: boolean
    }>()

    connections?.forEach((connection) => {
      const connectionInfo = connectionInfoMap.get(connection.id)!
      const connectionType = connectionInfo.type
      const connectionWeight = weightMap[connectionType]
      const connectionRating = connectionInfo.rating || 3 // Default to medium rating if not set

      if (connection.bookmarked_companies && Array.isArray(connection.bookmarked_companies)) {
        connection.bookmarked_companies.forEach((companyId: number) => {
          if (!companyMap.has(companyId)) {
            companyMap.set(companyId, {
              connectionCount: 0,
              connections: [],
              quantity_score: 0,
              quality_scores: [],
              warm_intro_possible: false
            })
          }
          const companyData = companyMap.get(companyId)!

          // Quantity score (cumulative weight)
          companyData.connectionCount++
          companyData.quantity_score += connectionWeight

          // Quality score (individual connection strength)
          const action_weight = 1.0 // bookmarked
          const individual_quality_score = connectionRating * action_weight * connectionWeight
          companyData.quality_scores.push(individual_quality_score)

          companyData.connections.push({
            id: connection.id,
            name: `${connection.first_name || ''} ${connection.last_name || ''}`.trim()
          })
        })
      }
    })

    // Query applications table for companies that connections have applied to
    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select('candidate_id, company_id')
      .in('candidate_id', connectionIds)

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError)
    } else if (applications) {
      applications.forEach((app) => {
        const companyId = app.company_id
        const candidateId = app.candidate_id
        const candidate = connections?.find(c => c.id === candidateId)

        if (candidate) {
          const connectionInfo = connectionInfoMap.get(candidateId)!
          const connectionWeight = weightMap[connectionInfo.type]
          const connectionRating = connectionInfo.rating || 3
          const action_weight = 2.0 // applied (higher weight than bookmarked)
          const individual_quality_score = connectionRating * action_weight * connectionWeight

          if (!companyMap.has(companyId)) {
            companyMap.set(companyId, {
              connectionCount: 1,
              connections: [{
                id: candidateId,
                name: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim()
              }],
              quantity_score: 1.5,
              quality_scores: [individual_quality_score],
              warm_intro_possible: false
            })
          } else {
            const companyData = companyMap.get(companyId)!
            companyData.quantity_score += 1.5
            companyData.quality_scores.push(individual_quality_score)
          }
        }
      })
    }

    // Calculate average quality score for each company
    const companyMapWithScores = new Map<number, {
      connectionCount: number
      connections: Array<{ id: number; name: string }>
      quantity_score: number
      quality_score: number
    }>()

    companyMap.forEach((companyData, companyId) => {
      let avg_quality_score = 0
      if (companyData.quality_scores.length > 0) {
        avg_quality_score = companyData.quality_scores.reduce((sum, score) => sum + score, 0) / companyData.quality_scores.length

        // TODO: Incorporate note content analysis to boost quality score
        // Example: Analyze connectionInfo.note for positive sentiment/keywords
        // If positive note exists, could add +0.5 to avg_quality_score
      }

      companyMapWithScores.set(companyId, {
        connectionCount: companyData.connectionCount,
        connections: companyData.connections,
        quantity_score: companyData.quantity_score,
        quality_score: avg_quality_score
      })
    })

    // If no companies found, return empty object
    if (companyMapWithScores.size === 0) {
      return NextResponse.json({ companies: {} })
    }

    // Sort companies by quantity_score (highest first) and convert to plain object
    const sortedEntries = Array.from(companyMapWithScores.entries())
      .sort(([, a], [, b]) => b.quantity_score - a.quantity_score)

    // Convert to plain object with both quantity and quality scores
    const companiesObject = Object.fromEntries(
      sortedEntries.map(([key, value]) => [
        key,
        {
          connectionCount: value.connectionCount,
          connections: value.connections,
          weight: value.quantity_score, // Keep as 'weight' for backward compatibility
          quality_score: value.quality_score
        }
      ])
    )

    return NextResponse.json({ companies: companiesObject })
  } catch (error) {
    console.error('Error fetching network companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch network companies' },
      { status: 500 }
    )
  }
}
