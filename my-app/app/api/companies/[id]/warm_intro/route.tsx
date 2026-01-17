import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const companyId = parseInt(resolvedParams.id)

    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 })
    }

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

    // If no connections, warm intro not available
    if (connectionInfoMap.size === 0) {
      return NextResponse.json({
        warm_intro_available: false,
        quality_score: 0,
        connectionCount: 0,
        connections: []
      })
    }

    const connectionIds = Array.from(connectionInfoMap.keys())

    // Fetch connections who have bookmarked this specific company
    const { data: connections, error: connectionsError } = await supabase
      .from('subscribers')
      .select('id, first_name, last_name, bookmarked_companies')
      .in('id', connectionIds)
      .contains('bookmarked_companies', [companyId])

    if (connectionsError) throw connectionsError

    // Track company data
    let connectionCount = 0
    const quality_scores: number[] = []
    const connectionsList: Array<{ id: number; name: string }> = []

    // Process bookmarked connections
    connections?.forEach((connection) => {
      const connectionInfo = connectionInfoMap.get(connection.id)!
      const connectionType = connectionInfo.type
      const connectionWeight = weightMap[connectionType]
      const connectionRating = connectionInfo.rating || 3 // Default to medium rating if not set

      connectionCount++
      const action_weight = 1.0 // bookmarked
      const individual_quality_score = connectionRating * action_weight * connectionWeight
      quality_scores.push(individual_quality_score)

      connectionsList.push({
        id: connection.id,
        name: `${connection.first_name || ''} ${connection.last_name || ''}`.trim()
      })
    })

    // Query applications table for connections that have applied to this company
    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select('candidate_id')
      .eq('company_id', companyId)
      .in('candidate_id', connectionIds)

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError)
    } else if (applications && applications.length > 0) {
      // Fetch subscriber details for application candidates
      const candidateIds = applications.map(app => app.candidate_id)
      const { data: candidates, error: candidatesError } = await supabase
        .from('subscribers')
        .select('id, first_name, last_name')
        .in('id', candidateIds)

      if (!candidatesError && candidates) {
        candidates.forEach((candidate) => {
          const connectionInfo = connectionInfoMap.get(candidate.id)!
          const connectionWeight = weightMap[connectionInfo.type]
          const connectionRating = connectionInfo.rating || 3
          const action_weight = 2.0 // applied (higher weight than bookmarked)
          const individual_quality_score = connectionRating * action_weight * connectionWeight

          quality_scores.push(individual_quality_score)

          // Add to connections list if not already there
          if (!connectionsList.some(c => c.id === candidate.id)) {
            connectionCount++
            connectionsList.push({
              id: candidate.id,
              name: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim()
            })
          }
        })
      }
    }

    // Calculate average quality score
    let avg_quality_score = 0
    if (quality_scores.length > 0) {
      avg_quality_score = quality_scores.reduce((sum, score) => sum + score, 0) / quality_scores.length
    }

    // Warm intro is available if quality_score >= 3.0
    const warm_intro_available = avg_quality_score >= 3.0

    return NextResponse.json({
      warm_intro_available,
      quality_score: avg_quality_score,
      connectionCount,
      connections: connectionsList
    })

  } catch (error) {
    console.error('Error checking warm intro availability:', error)
    return NextResponse.json(
      { error: 'Failed to check warm intro availability' },
      { status: 500 }
    )
  }
}
