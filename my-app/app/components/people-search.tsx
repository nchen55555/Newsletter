'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, UserPlus } from 'lucide-react'
import { ProfileData, ConnectionData } from '@/app/types'
import ProfileAvatar from './profile_avatar'
import { ConnectDialog } from './connect_dialog'

interface PeopleSearchProps {
  allProfiles: ProfileData[]
  currentUserData: ProfileData | null
  loadingProfiles: boolean
  currentUserId: number
  onConnectionUpdate?: () => void
}

interface SimilarUser {
  id: number
  first_name: string
  last_name: string
  bio?: string | null
  profile_image_url?: string | null
  linkedin_url?: string | null
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
  const [similarProfiles, setSimilarProfiles] = useState<ProfileData[]>([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)

  // Fetch similar profiles on mount
  useEffect(() => {
    const fetchSimilarProfiles = async () => {
      if (!currentUserId) return;

      setLoadingSimilar(true);
      try {
        const response = await fetch(`/api/linkedin-similarity?user_id=${currentUserId}&limit=6`);
        if (response.ok) {
          const data: { similarUsers: SimilarUser[] } = await response.json();
          console.log('API response:', data);
          // Map the RPC results to ProfileData objects
          const profiles = data.similarUsers.map((user) => {
            const baseProfile = allProfiles.find(p => p.id === user.id);
            if (baseProfile) {
              // Override a few presentation fields on top of full backend profile
              return {
                ...baseProfile,
                bio: user.bio ?? baseProfile.bio,
                profile_image_url: user.profile_image_url ?? baseProfile.profile_image_url,
                linkedin_url: user.linkedin_url ?? baseProfile.linkedin_url,
              } as ProfileData;
            }

            // Fallback: construct a minimal ProfileData (using sensible defaults)
            return {
              id: user.id,
              email: "",
              first_name: user.first_name,
              last_name: user.last_name,
              school: "",
              linkedin_url: user.linkedin_url ?? "",
              resume_url: "",
              personal_website: "",
              phone_number: "",
              access_token: "",
              profile_image_url: user.profile_image_url ?? "",
              bio: user.bio ?? "",
            } as ProfileData;
          });

          setSimilarProfiles(profiles);
          console.log('Similar profiles:', profiles);
        }
      } catch (error) {
        console.error('Failed to fetch similar profiles:', error);
      } finally {
        setLoadingSimilar(false);
      }
    };

    fetchSimilarProfiles();
  }, [currentUserId, allProfiles]);

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
      <div className="max-w-4xl w-full mx-auto relative mb-16 mt-12">
        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-neutral-400 w-6 h-6 z-10" />
        <Input
          type="text"
          placeholder="Add 2 or more people who you want to define your career trajectory ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-16 pr-6 h-16 w-full rounded-2xl border-2 border-neutral-300 text-lg md:text-xl shadow-sm
             focus:border-black focus:ring-2 focus:ring-black transition-all"
        />
      </div>

      {/* Recommended Profiles - show similar people when no search query */}
      {!searchQuery.trim() && (
        <div className="mb-8 max-w-3xl mx-auto mt-8">
          <h4 className="text-base font-medium mb-4 text-center text-neutral-500">
            {similarProfiles.length > 0 ? 'People Similar To You' : 'You Might Know These People'}
          </h4>
          {loadingSimilar ? (
            <div className="text-center py-8 text-neutral-400">
              Loading recommendations...
            </div>
          ) : (
            <div className="space-y-2">
              {(similarProfiles.length > 0 ? similarProfiles : allProfiles
                .filter(profile => profile.id !== currentUserId)
                .sort(() => Math.random() - 0.5)
                .slice(0, 5))
              .map((profile) => (
                <div key={profile.id} className="border border-neutral-200 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ProfileAvatar
                      name={`${profile.first_name} ${profile.last_name}`}
                      imageUrl={profile.profile_image_url || undefined}
                      size={40}
                      editable={false}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-200">
                        {profile.first_name} {profile.last_name}
                      </h3>
                      {profile.bio && (
                        <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                          {profile.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {(() => {
                      const status = getConnectionStatus(profile);
                      if (status === 'connected') {
                        return (
                          <Button disabled className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-xs h-8 px-3">
                            <UserPlus className="w-3 h-3" />
                            Connected
                          </Button>
                        );
                      } else if (status === 'pending_sent') {
                        return (
                          <Button disabled className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-xs h-8 px-3">
                            <UserPlus className="w-3 h-3" />
                            Accept Connection
                          </Button>
                        );
                      } else {
                        return (
                          status === 'requested' ? (
                            <Button
                              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-xs h-8 px-3"
                              onClick={() => {
                                handleConnectClick(profile);
                                handleDialogChange(true);
                              }}
                            >
                              <UserPlus className="w-3 h-3" />
                              Request Pending
                            </Button>
                          ) : (
                            <Button
                              className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs h-8 px-3"
                              onClick={() => {
                                handleConnectClick(profile);
                                handleDialogChange(true);
                              }}
                            >
                              <UserPlus className="w-3 h-3" />
                              Connect
                            </Button>
                          )
                        );
                      }
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Results - Profile Rows */}
      {searchQuery.trim() && (
        <div className="space-y-2 mb-8 max-w-3xl mx-auto">
          {searchResults.length > 0 ? (
            searchResults.slice(0, 6).map((profile) => (
              <div key={profile.id} className="border border-neutral-200 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ProfileAvatar
                    name={`${profile.first_name} ${profile.last_name}`}
                    imageUrl={profile.profile_image_url || undefined}
                    size={40}
                    editable={false}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-200">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    {profile.bio && (
                      <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {(() => {
                    const status = getConnectionStatus(profile);
                    if (status === 'connected') {
                      return (
                        <Button disabled className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-xs h-8 px-3">
                          <UserPlus className="w-3 h-3" />
                          Connected
                        </Button>
                      );
                    } else if (status === 'pending_sent') {
                      return (
                        <Button disabled className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-xs h-8 px-3">
                          <UserPlus className="w-3 h-3" />
                          Accept Connection
                        </Button>
                      );
                    } else {
                      return (
                        status === 'requested' ? (
                          <Button
                            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-xs h-8 px-3"
                            onClick={() => {
                              handleConnectClick(profile);
                              handleDialogChange(true);
                            }}
                          >
                            <UserPlus className="w-3 h-3" />
                            Request Pending
                          </Button>
                        ) : (
                          <Button
                            className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs h-8 px-3"
                            onClick={() => {
                              handleConnectClick(profile);
                              handleDialogChange(true);
                            }}
                          >
                            <UserPlus className="w-3 h-3" />
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