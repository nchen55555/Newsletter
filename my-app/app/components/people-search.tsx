'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, UserPlus } from 'lucide-react'
import { ProfileData, ConnectionData } from '@/app/types'
import ProfileCard from './profile_card'
import ProfileAvatar from './profile_avatar'
import { ConnectDialog } from './connect_dialog'

interface PeopleSearchProps {
  allProfiles: ProfileData[]
  currentUserData: ProfileData | null
  loadingProfiles: boolean
  currentUserId: number
  onConnectionUpdate?: () => void
}

export function PeopleSearch({ 
  allProfiles, 
  currentUserData, 
  loadingProfiles, 
  currentUserId,
  onConnectionUpdate 
}: PeopleSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error' | 'pending'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  // Filter profiles based on search query
  const searchResults = allProfiles.filter(profile => {
    const hasNames = profile.first_name && 
                    profile.last_name && 
                    profile.first_name.trim() !== '' && 
                    profile.last_name.trim() !== '';
    
    if (!hasNames || !searchQuery.trim()) return false; // Only show results when searching
    
    const fullName = `${profile.first_name} ${profile.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query);
  }).slice(0, 8) // Limit to 8 results

  // Get connection status between current user and another profile
  const getConnectionStatus = (profile?: ProfileData | null): 'connected' | 'pending_sent' | 'requested' | 'none' => {
    if (!currentUserData || !profile || !profile.id) return 'none';

    const userConnections = Array.isArray(currentUserData.connections_new) ? currentUserData.connections_new : [];
    const userPendingConnections = Array.isArray(currentUserData.pending_connections_new) ? currentUserData.pending_connections_new : [];
    const userRequestedConnections = Array.isArray(currentUserData.requested_connections_new) ? currentUserData.requested_connections_new : [];

    const pid = String(profile.id);

    const isConnected = userConnections.some((conn: ConnectionData) => String(conn.connect_id) === pid);
    if (isConnected) return 'connected';

    const isRequested = userPendingConnections.some((conn: ConnectionData) => String(conn.connect_id) === pid);
    if (isRequested) return 'requested';

    const isPendingSent = userRequestedConnections.some((conn: ConnectionData) => String(conn.connect_id) === pid);
    if (isPendingSent) return 'pending_sent';

    return 'none';
  };

  // Get existing rating for a connection (only from requested_connections_new and connections_new)
  const getExistingRating = (profile?: ProfileData | null): number | undefined => {
    if (!currentUserData || !profile || !profile.id) return undefined;

    const userConnections = Array.isArray(currentUserData.connections_new) ? currentUserData.connections_new : [];
    const userPendingConnections = Array.isArray(currentUserData.pending_connections_new) ? currentUserData.pending_connections_new : [];
    const pid = String(profile.id);

    // Check only connections_new and requested_connections_new
    const connection = userConnections.find((conn: ConnectionData) => String(conn.connect_id) === pid)
      || userPendingConnections.find((conn: ConnectionData) => String(conn.connect_id) === pid);

    return connection?.rating;
  };

  // Get existing note for a connection (only from requested_connections_new and connections_new)
  const getExistingNote = (profile?: ProfileData | null): string | undefined => {
    if (!currentUserData || !profile || !profile.id) return undefined;

    const userConnections = Array.isArray(currentUserData.connections_new) ? currentUserData.connections_new : [];
    const userPendingConnections = Array.isArray(currentUserData.pending_connections_new) ? currentUserData.pending_connections_new : [];
    const pid = String(profile.id);

    // Check only connections_new and requested_connections_new
    const connection = userConnections.find((conn: ConnectionData) => String(conn.connect_id) === pid)
      || userPendingConnections.find((conn: ConnectionData) => String(conn.connect_id) === pid);

    return connection?.note;
  };

  const getExistingAlignmentValue = (profile?: ProfileData | null): number | undefined => {
    if (!currentUserData || !profile || !profile.id) return undefined;

    const userConnections = Array.isArray(currentUserData.connections_new) ? currentUserData.connections_new : [];
    const userPendingConnections = Array.isArray(currentUserData.pending_connections_new) ? currentUserData.pending_connections_new : [];
    const pid = String(profile.id);

    const connection = userConnections.find((conn: ConnectionData) => String(conn.connect_id) === pid)
      || userPendingConnections.find((conn: ConnectionData) => String(conn.connect_id) === pid);

    return connection?.alignment_value;
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setVerificationStatus('idle')
      setStatusMessage('')
      setSelectedProfile(null)
    }
  }

  const handleConnectClick = (profile: ProfileData) => {
    setSelectedProfile(profile)
    setDialogOpen(true)
  }

  const handleConnectionScale = async (scaleValue: number, alignmentValue?: number, note?: string) => {
    if (alignmentValue === null) return;
    if (!selectedProfile) return

    setIsSubmitting(true)
    setVerificationStatus('idle')

    try {
      const response = await fetch('/api/post_connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connect_id: selectedProfile.id,
          rating: scaleValue,
          alignment_value: alignmentValue,
          note: note
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.type === 'mutual') {
          setVerificationStatus('success')
          setStatusMessage(`You are now connected with ${selectedProfile.first_name}! The connection was mutual.`)
        } else {
          setVerificationStatus('success')
          setStatusMessage(`Connection request sent to ${selectedProfile.first_name}! They've received a notification.`)
        }

        // Auto-close dialog after showing success message
        setTimeout(() => {
          setDialogOpen(false)
          onConnectionUpdate?.() // Notify parent of connection update
        }, 2000)
      } else {
        setVerificationStatus('error')
        setStatusMessage('Failed to send connection request. Please try again.')
      }
    } catch (error) {
      console.error('Connection failed:', error)
      setVerificationStatus('error')
      setStatusMessage('Failed to send connection request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingProfiles) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
        <p className="mt-2 text-neutral-600">Loading people...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="max-w-3xl w-full mx-auto relative mb-10">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5 z-10" />
        <Input
          type="text"
          placeholder="Add the people who you want to define your career trajectory ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-4 h-12 w-full rounded-xl border-neutral-300 text-base md:text-lg
             focus:border-black focus:ring-black"
        />
      </div>

      {/* Recommended Profiles - show 4 random people when no search query */}
      {!searchQuery.trim() && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4 text-center">
            You Might Know These People
          </h4>
          <div className="grid grid-cols-5 gap-4">
            {allProfiles
              .filter(profile => profile.id !== currentUserId)
              .sort(() => Math.random() - 0.5)
              .slice(0, 5)
              .map((profile) => (
                <div key={profile.id}>
                  <ProfileCard
                    profile={profile}
                    onClick={() => {}}
                    connectionStatus={getConnectionStatus(profile)}
                    connectionRating={getExistingRating(profile)}
                    initialNote={getExistingNote(profile)}
                    alignmentValue={getExistingAlignmentValue(profile)}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Search Results - Profile Rows */}
      {searchQuery.trim() && (
        <div className="space-y-4 mb-8">
          {searchResults.length > 0 ? (
            searchResults.slice(0, 6).map((profile) => (
              <div key={profile.id} className="border border-neutral-200 rounded-2xl p-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <ProfileAvatar
                    name={`${profile.first_name} ${profile.last_name}`}
                    imageUrl={profile.profile_image_url || undefined}
                    size={64}
                    editable={false}
                    className="w-16 h-16 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="text-lg font-semibold text-neutral-200">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    {profile.bio && (
                      <p className="text-sm text-neutral-400 line-clamp-2 mt-1 pr-2">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  {(() => {
                    const status = getConnectionStatus(profile);
                    if (status === 'connected') {
                      return (
                        <Button disabled className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                          <UserPlus className="w-4 h-4" />
                          Connected
                        </Button>
                      );
                    } else if (status === 'pending_sent') {
                      return (
                        <Button disabled className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                          <UserPlus className="w-4 h-4" />
                          Accept Connection
                        </Button>
                      );
                    } else {
                      return (
                        status === 'requested' ? (
                          <Button
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
                            onClick={() => {
                              handleConnectClick(profile);
                              handleDialogChange(true);
                            }}
                          >
                            <UserPlus className="w-4 h-4" />
                            Request Pending
                          </Button>
                        ) : (
                          <Button
                            className="inline-flex items-center gap-2 whitespace-nowrap"
                            onClick={() => {
                              handleConnectClick(profile);
                              handleDialogChange(true);
                            }}
                          >
                            <UserPlus className="w-4 h-4" />
                            Connect
                          </Button>
                        )
                      );
                    }
                  })()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-neutral-600">
              No people found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      )}

      {/* Connection Dialog */}
      <ConnectDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        trigger={null}
        firstName={selectedProfile?.first_name || ""}
        profileImageUrl={selectedProfile?.profile_image_url || undefined}
        isSubmitting={isSubmitting}
        verificationStatus={verificationStatus}
        statusMessage={statusMessage}
        existingRating={getExistingRating(selectedProfile)}
        existingAlignmentValue={getExistingAlignmentValue(selectedProfile)}
        initialNote={getExistingNote(selectedProfile)}
        onSubmit={handleConnectionScale}
        connectionStatus={getConnectionStatus(selectedProfile)}
        compact={true}
      />
    </div>
  )
}