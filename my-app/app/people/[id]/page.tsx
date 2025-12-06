
"use client";
import { useEffect, useState } from "react";
import { Navigation } from "../../components/header";
import { Container } from "../../components/container";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProfileData, CompanyData, ConnectionData } from "@/app/types";
import { Linkedin, Globe, UserPlus, Info, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReferralDialog } from "@/app/components/referral-dialog";
import ProfileAvatar from "../../components/profile_avatar";
import { CompanyRow } from "../../companies/company-row";
import { decodeSimple } from "../../utils/simple-hash";
import { ConnectionScale } from "../../components/connection-scale";
import { ConnectDialog } from "../../components/connect_dialog";

export default function PeopleProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<ProfileData | null>(null); 
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error' | 'invalid'>('idle');
  const [statusMessage, setStatusMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'connected' | 'pending_sent' | 'requested'>('none');
  const [existingRating, setExistingRating] = useState<number | undefined>(undefined);
  const [bookmarkedCompanies, setBookmarkedCompanies] = useState<(CompanyData & { imageUrl: string | null })[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setProfileId(id);
      
      // Decode the hashed ID to get the actual profile ID
      const actualId = decodeSimple(id);
      if (!actualId) {
        console.error('Invalid profile ID hash:', id);
        setData(null);
        setLoading(false);
        return;
      }
      
      // Fetch profile data using the external profile API
      const apiUrl = `/api/get_external_profile?id=${actualId}`;
      
      try {
        const res = await fetch(apiUrl);
        if (res.ok) {
          const profileData = await res.json();
          setData(profileData);
        } else {
          setData(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    
    getParams();
  }, [params]);

  // Check connection status (connected, pending sent, pending received, or none)
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!profileId) return;
      
      try {
        const actualId = decodeSimple(profileId);
        if (!actualId) return;
        
        // Fetch user's connections and pending connections from get_profile API
        const response = await fetch("/api/get_profile", { credentials: "include" });
        if (response.ok) {
          const userData = await response.json();
          const userConnections = userData.connections_new || [];
          const userPendingConnections = userData.pending_connections_new || [];
          const userRequestedConnections = userData.requested_connections_new || [];
          
          // Check if this profile's actual ID is in the user's connections (mutual connection)
          const connectedEntry = (userConnections as ConnectionData[]).find((conn: ConnectionData) => conn.connect_id === actualId);
            
          if (connectedEntry) {
            setConnectionStatus('connected');
            if (connectedEntry.rating) {
              setExistingRating(connectedEntry.rating);
            }
            return;
          }
          
          // Check if user has sent a pending request to this profile
          const pendingEntry = (userPendingConnections as ConnectionData[]).find((conn: ConnectionData) => conn.connect_id === actualId);
            
          if (pendingEntry) {
            setConnectionStatus('pending_sent');
            if (pendingEntry.rating) {
              setExistingRating(pendingEntry.rating);
            }
            return;
          }
          
          // Check if this profile is in the user's requested connections
          const requestedEntry = (userRequestedConnections as ConnectionData[]).find((conn: ConnectionData) => conn.connect_id === actualId);
            
          if (requestedEntry) {
            setConnectionStatus('requested');
            if (requestedEntry.rating) {
              setExistingRating(requestedEntry.rating);
            }
            return;
          }
          
          // No connection or pending requests
          setConnectionStatus('none');
        } else {
          console.error("Failed to fetch user connections");
          setConnectionStatus('none');
        }
      } catch (error) {
        console.error("Error checking connection status:", error);
        setConnectionStatus('none');
      }
    };
    
    checkConnectionStatus();
  }, [profileId, data]);

  // Fetch bookmarked companies using API
  useEffect(() => {
    const fetchBookmarkedCompanies = async () => {
      if (!data?.bookmarked_companies || connectionStatus !== 'connected') {
        setBookmarkedCompanies([]);
        return;
      }

      setLoadingBookmarks(true);
      try {
        const response = await fetch('/api/companies', {
          credentials: 'include'
        });

        if (response.ok) {
          const allCompanies = await response.json();
          
          // Filter companies based on bookmarked company IDs
          const filteredCompanies = allCompanies.filter((company: CompanyData & { imageUrl: string | null }) => 
            data.bookmarked_companies?.includes(company.company)
          );

          setBookmarkedCompanies(filteredCompanies);
        }
      } catch (error) {
        console.error('Error fetching bookmarked companies:', error);
        setBookmarkedCompanies([]);
      } finally {
        setLoadingBookmarks(false);
      }
    };

    fetchBookmarkedCompanies();
  }, [data, connectionStatus]);



  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Reset status when dialog closes
      setVerificationStatus('idle');
      setStatusMessage("");
    }
  };

  const handleConnectionScale = async (scaleValue: number, note?: string) => {
    setIsSubmitting(true);
    setVerificationStatus('idle');
    
    try {
      const response = await fetch('/api/post_connect', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connect_id: data?.id,
          rating: scaleValue, 
          note: note
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.type === 'mutual') {
          setVerificationStatus('success');
          setStatusMessage(`You are now connected with ${data?.first_name}! The connection was mutual.`);
          setConnectionStatus('connected');
        } else {
          setVerificationStatus('success');
          setStatusMessage(`Connection request sent to ${data?.first_name}! They've received a notification.`);
          setConnectionStatus('pending_sent');
        }
        setDialogOpen(false);
      } else {
        setVerificationStatus('error');
        setStatusMessage("Failed to send connection request. Please try again.");
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setVerificationStatus('error');
      setStatusMessage("Failed to send connection request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
        <Navigation />
        <div className="pt-12 pb-8 px-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
          <Container className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-32 w-full" />
            </div>
          </Container>
        </div>
      </div>
    );
  }

  if (!data || !profileId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
        <Navigation />
        <div className="pt-12 pb-8 px-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
          <Container className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Profile Not Found</h1>
              <p className="text-neutral-600">The profile you&apos;re looking for doesn&apos;t exist or isn&apos;t available.</p>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <div className="pt-12 pb-8 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
        <Container className="max-w-6xl mx-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-8">
              {/* Welcome Header */}
              <div className="text-center pt-16 pb-8">
                <div className="flex items-center gap-6 mb-6">
                  <ProfileAvatar
                    name={`${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email || 'User'}
                    imageUrl={data.profile_image_url || undefined}
                    size={160}
                    editable={false}
                    className="w-40 h-40 rounded-full"
                  />

                  <div className="min-w-0 text-left">
                    <h1 className="text-4xl md:text-5xl font-semibold text-black mb-4">
                      {data.first_name} {data.last_name}
                    </h1>
                    
                    
                    
                    {connectionStatus === 'connected' ? (
                      <Button disabled className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 via-pink-100 to-yellow-100 text-purple-800 border-purple-300">
                        <UserPlus className="w-4 h-4" />
                        Connected
                      </Button>
                    ) : connectionStatus === 'pending_sent' ? (
                      <Button disabled className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 border-gray-300">
                        <UserPlus className="w-4 h-4" />
                        Request Sent
                      </Button>
                    ) : connectionStatus === 'requested' ? (
                      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
                        <DialogTrigger asChild>
                          <Button className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200">
                            <UserPlus className="w-4 h-4" />
                            Accept Request
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl w-full px-12 py-8">
                        <DialogHeader>
                          <DialogTitle>Accept Connection Request from {data.first_name}</DialogTitle>
                          <DialogDescription>
                            {data.first_name} has sent you a connection request. 
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 mt-6">
                          <ConnectionScale
                            onSubmit={handleConnectionScale}
                            isSubmitting={isSubmitting}
                            personName={data.first_name}
                            initialRating={existingRating}
                          />
                          
                          {/* Status Message Display */}
                          {verificationStatus !== 'idle' && (
                            <div className={`mt-6 p-4 rounded-lg text-sm ${
                              verificationStatus === 'success' 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : verificationStatus === 'error'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            }`}>
                              {statusMessage}
                            </div>
                          )}
                        </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <ConnectDialog
                        open={dialogOpen}
                        onOpenChange={handleDialogChange}
                        firstName={data.first_name}
                        isSubmitting={isSubmitting}
                        verificationStatus={verificationStatus}
                        statusMessage={statusMessage}
                        existingRating={existingRating}
                        onSubmit={handleConnectionScale}
                      />
                    )}
                  </div>
                  
                </div>
                
              </div>
{/* Show connection degree if connected */}
                    {(connectionStatus === 'connected') && existingRating && (
                      <div className="mb-4">
                        <ConnectionScale
                          onSubmit={async (newRating) => {
                            try {
                              const response = await fetch('/api/post_connect', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  connect_id: data?.id,
                                  rating: newRating
                                })
                              });
                              
                              if (response.ok) {
                                setExistingRating(newRating);
                                console.log('Connection rating updated successfully');
                              } else {
                                console.error('Failed to update connection rating');
                              }
                            } catch (error) {
                              console.error('Error updating connection rating:', error);
                            }
                          }}
                          isSubmitting={false}
                          personName={data.first_name}
                          initialRating={existingRating}
                          showConnectButton={false}
                        />
                      </div>
                    )}
              

              {/* Bio Section */}
              {data.bio && data.bio.length > 0 && (
                <div className="w-full max-w-4xl space-y-3">
                  <h3 className="text-sm font-medium text-neutral-900">Bio</h3>
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                      {data.bio}
                    </div>
                  </div>
                </div>
              )}

              {/* Interests */}
              {data.interests && data.interests.length > 0 && (
                <div className="w-full max-w-4xl space-y-3">
                  <h3 className="text-sm font-medium text-neutral-900">Interests & Background</h3>
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                      {data.interests}
                    </div>
                  </div>
                </div>
              )}

              {/* Links and Documents */}
              {(data.linkedin_url || data.personal_website || data.transcript_url || data.resume_url) && (
                <div className="w-full max-w-4xl">
                  <div className="flex flex-wrap gap-3">
                    {data.linkedin_url && (
                      <Button asChild variant="outline" size="sm">
                        <a href={data.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {data.personal_website && (
                      <Button asChild variant="outline" size="sm">
                        <a href={data.personal_website.startsWith('http') ? data.personal_website : `https://${data.personal_website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Bookmarked Companies Section */}
              <div className="w-full max-w-4xl space-y-6">
                <h3 className="text-lg font-medium text-neutral-900">Companies {data.first_name} Bookmarked</h3>
                {connectionStatus === 'connected' ? (
                  <>
                    {loadingBookmarks ? (
                      <div className="space-y-4">
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <Skeleton className="h-32 w-full rounded-lg" />
                      </div>
                    ) : bookmarkedCompanies.length > 0 ? (
                      <div className="space-y-4">
                        {bookmarkedCompanies.map((company) => (
                          <CompanyRow key={company._id} company={company} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-neutral-500">
                        {data.first_name} hasn&apos;t bookmarked any companies yet.
                      </div>
                    )}
                  </>
                ) : (
                  <Alert className="max-w-2xl mx-auto">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Verify your connection to see what {data.first_name} is interested in
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Referral Section */}
              <div className="w-full max-w-4xl space-y-4">
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="inline-flex items-center gap-2 rounded-full border-neutral-300 text-neutral-700 hover:border-black hover:text-black transition-all duration-200"
                    onClick={() => setShowReferralDialog(true)}
                  >
                  <Users className="w-2.5 h-2.5" />
                    Refer Someone To The Niche Network
                  </Button>
                </div>
              </div>

              <div className="text-center text-sm text-neutral-600 py-8">
                Network Profile
                <div className="mt-2 text-neutral-500">
                  Connect with {data.first_name} through The Niche Network.
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
      
      {/* Referral Dialog */}
      <ReferralDialog 
        open={showReferralDialog} 
        onOpenChange={setShowReferralDialog}
        title="Refer Someone to The Niche"
        description="We are personal referral only and will verify if your referral is a good fit for our partner companies!"
      />
    </div>
  );
}
