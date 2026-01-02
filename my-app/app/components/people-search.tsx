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

  const handleConnectionScale = async (scaleValue: number, note?: string) => {
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
        
        setDialogOpen(false)
        onConnectionUpdate?.() // Notify parent of connection update
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
      <div className="max-w-md mx-auto relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
        <Input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 w-full rounded-full border-neutral-200 focus:border-black focus:ring-black"
        />
      </div>

      {/* Recommended Profiles - show 4 random people when no search query */}
      {!searchQuery.trim() && (
        <div className="max-w-4xl mx-auto mb-8">
          <h4 className="text-lg font-semibold text-neutral-900 mb-4 text-center">
            Recommended To You
          </h4>
          <div className="grid gap-4 md:grid-cols-1">
            {allProfiles
              .filter(profile => profile.id !== currentUserId)
              .sort(() => Math.random() - 0.5)
              .slice(0, 3)
              .map((profile) => (
                <div key={profile.id}>
                  <ProfileCard
                    profile={profile}
                    onClick={() => {
                      handleConnectClick(profile);
                      handleDialogChange(true);
                    }}
                    connectionStatus={getConnectionStatus(profile)}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Search Results - Profile Rows */}
      {searchQuery.trim() && (
        <div className="max-w-4xl mx-auto space-y-4 mb-8">
          {searchResults.length > 0 ? (
            searchResults.slice(0, 6).map((profile) => (
              <div key={profile.id} className="bg-white border border-neutral-200 rounded-2xl p-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <ProfileAvatar
                    name={`${profile.first_name} ${profile.last_name}`}
                    imageUrl={profile.profile_image_url || undefined}
                    size={64}
                    editable={false}
                    className="w-16 h-16 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    {profile.bio && (
                      <p className="text-sm text-neutral-600 line-clamp-2 mt-1 pr-2">
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
                          Request Sent
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
                            Accept Request
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
                            Add to Network
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
        isSubmitting={isSubmitting}
        verificationStatus={verificationStatus}
        statusMessage={statusMessage}
        onSubmit={handleConnectionScale}
      />
    </div>
  )
}