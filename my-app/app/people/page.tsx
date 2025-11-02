'use client'
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import { ProfileData, ConnectionData } from "@/app/types";
import { VerificationProtectedContent } from "@/app/components/verification-protected-content";
import React, { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, AlertCircle, UserPlus } from "lucide-react";
import ProfileAvatar from "@/app/components/profile_avatar";
import ProfileCard from "@/app/components/profile_card";
import { encodeSimple } from "@/app/utils/simple-hash";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReferralDialog } from "@/app/components/referral-dialog";

// Profile Card Skeleton Component
function ProfileCardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-8 h-full">
      {/* Profile Image Skeleton */}
      <Skeleton className="w-32 h-32 mx-auto mb-6 rounded-full" />
      
      {/* Name Skeleton */}
      <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
      
      {/* Major Skeleton */}
      <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
      
      {/* University Skeleton */}
      <Skeleton className="h-4 w-2/3 mx-auto mb-4" />
      
      {/* Bio Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

// Loading Skeleton for entire page
function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col" style={{
        background: `
          radial-gradient(ellipse 700px 500px at 85% 15%, rgba(34, 197, 94, 0.3) 0%, rgba(124, 211, 87, 0.25) 15%, rgba(253, 224, 71, 0.3) 35%, rgba(253, 224, 71, 0.2) 60%, rgba(255, 255, 255, 0.8) 80%, rgba(255, 255, 255, 1) 100%),
          white
        `
      }}>
      <Navigation />
      <Container>
        <div className="max-w-6xl mx-auto py-8 md:py-16 px-4 md:px-6">
          {/* Header Section Skeleton */}
          <div className="mb-10">
            <Skeleton className="h-8 md:h-12 w-1/3 mb-4" />
            <Skeleton className="h-4 md:h-6 w-full mb-2" />
            <Skeleton className="h-4 md:h-6 w-3/4" />
          </div>

          {/* Profiles List Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>

          {/* Call to Action Skeleton */}
          <div className="mt-12 text-center">
            <Skeleton className="h-6 w-1/4 mx-auto mb-4" />
            <Skeleton className="h-4 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-12 w-32 mx-auto" />
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function PeoplePage() {
  // const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Show skeleton for 1 second

    return () => clearTimeout(timer);
  }, []);

  const [allProfiles, setAllProfiles] = useState<[ProfileData] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [viewProfileGrid, setViewProfileGrid] = useState(false);
  const [gridSearchQuery, setGridSearchQuery] = useState("");
  const [verifiedConnections, setVerifiedConnections] = useState<ConnectionData[]>([]);
  const [pendingConnections, setPendingConnections] = useState<ConnectionData[]>([]);
  const [requestedConnections, setRequestedConnections] = useState<ConnectionData[]>([]);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [userApplied, setUserApplied] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'connections' | 'pending' | 'requested'>('connections');


  const router = useRouter();

  useEffect(() => {
    // Fetch all profiles
    fetch("/api/get_cohort", { credentials: "include" })
      .then(res => res.json())
      .then(data => data.profiles)
      .then(setAllProfiles);

    // Fetch user's connections and applied status
    fetch("/api/get_profile", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setVerifiedConnections(data.connections_new || []);
        setPendingConnections(data.pending_connections_new || []);
        setRequestedConnections(data.requested_connections_new || []);
        setUserApplied(data.applied || false);
        setCurrentUserId(data.id);
      })
      .catch(error => {
        console.error("Failed to fetch user profile:", error);
        setVerifiedConnections([]);
        setPendingConnections([]);
        setUserApplied(false);
      });
  }, []);

  const handleProfileClick = (profile: ProfileData) => {
    router.push(`/people/${encodeSimple(profile.id)}`);
  };

  // Get connection status between current user and another profile
  const getConnectionStatus = (profile: ProfileData) => {
    if (!currentUserId) return 'none';
    
    // Check if they are in user's verified connections (mutual connection exists)
    const isConnected = verifiedConnections.some((conn: ConnectionData) => conn.connect_id === profile.id);
      
    if (isConnected) {
      return 'connected';
    }
    
    // Check if user has sent a pending request to them
    const isPendingSent = pendingConnections.some((conn: ConnectionData) => conn.connect_id === profile.id);
      
    if (isPendingSent) {
      return 'pending_sent';
    }
    
    // Check if they have sent a pending request to user
    if (profile.requested_connections?.includes(profile.id)) {
      return 'requested';
    }
    
    return 'none';
  };

  // Helper function for backward compatibility with isConnected prop
  const isMutuallyConnected = (profile: ProfileData) => {
    return getConnectionStatus(profile) === 'connected';
  };

  // Filter profiles for search dropdown
  const searchResults = allProfiles?.filter(profile => {
    const hasNames = profile.first_name && 
                    profile.last_name && 
                    profile.first_name.trim() !== '' && 
                    profile.last_name.trim() !== '';
    
    if (!hasNames || !searchQuery) return false;
    
    const fullName = `${profile.first_name} ${profile.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query);
  }).slice(0, 8) || []; // Limit to 8 results

  const handleSearchResultClick = (profile: ProfileData) => {
    setSearchQuery(`${profile.first_name} ${profile.last_name}`);
    setShowDropdown(false);
    handleProfileClick(profile);
  };


  // Filter profiles for the grid view
  const filteredGridProfiles = allProfiles?.filter(profile => {
    const hasNames = profile.first_name && 
                    profile.last_name && 
                    profile.first_name.trim() !== '' && 
                    profile.last_name.trim() !== '';
    
    if (!hasNames) return false;
    if (!gridSearchQuery) return true;
    
    const fullName = `${profile.first_name} ${profile.last_name}`.toLowerCase();
    const query = gridSearchQuery.toLowerCase();
    return fullName.includes(query);
  }) || [];

  // Filter verified connections (must be mutual) - returns array of tuples [profile, rating]
  const verifiedConnectionProfiles = allProfiles?.filter(profile => {
    const hasNames = profile.first_name && 
                    profile.last_name && 
                    profile.first_name.trim() !== '' && 
                    profile.last_name.trim() !== '';
    
    return hasNames && isMutuallyConnected(profile);
  }).map(profile => {
    // Find the rating from user's own connections
    const connection = verifiedConnections.find((conn: ConnectionData) => conn.connect_id === profile.id);
    const rating = connection?.rating || null;
    return [profile, rating] as [ProfileData, number | null];
  }) || [];

  // Filter profiles based on user's pending_connections array
  const userPendingConnectionProfiles = allProfiles?.filter(profile => {
    const hasNames = profile.first_name && 
                    profile.last_name && 
                    profile.first_name.trim() !== '' && 
                    profile.last_name.trim() !== '';
    
    const isPending = pendingConnections.some((conn: ConnectionData) => conn.connect_id === profile.id);
      
    return hasNames && isPending;
  }) || [];

  // Filter profiles based on user's requested_connections array  
  const userRequestedConnectionProfiles = allProfiles?.filter(profile => {
    const hasNames = profile.first_name &&
                    profile.last_name &&
                    profile.first_name.trim() !== '' &&
                    profile.last_name.trim() !== '';

    const isRequested = requestedConnections.some((conn: ConnectionData) => conn.connect_id === profile.id);

    return hasNames && isRequested;
  }) || [];

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{
        background: `
          radial-gradient(ellipse 700px 500px at 85% 15%, rgba(34, 197, 94, 0.3) 0%, rgba(124, 211, 87, 0.25) 15%, rgba(253, 224, 71, 0.3) 35%, rgba(253, 224, 71, 0.2) 60%, rgba(255, 255, 255, 0.8) 80%, rgba(255, 255, 255, 1) 100%),
          white
        `
      }}>
      <Navigation />
      <Container>
        <div >
          <div className="animate-in fade-in-50 duration-700">
            {!isLoading && !viewProfileGrid && (
                <div className="flex flex-col items-center gap-8">
                    {/* Welcome Header */}
                    <div className="text-center pt-16 pb-8">
                        <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-black">
                            Your Niche Network
                        </h1>
                        <p className="text-lg md:text-xl text-neutral-600 leading-relaxed font-light max-w-5xl mx-auto mb-8">
                            Curate a personalized and verified professional network on The Niche by verifying your degree of connection and customizing how much to index on your connections&apos; interests and opportunities for your own opportunity recommendations.
                        </p>
                        
                        {/* Show content based on application status */}
                        {userApplied === false ? (
                          <Alert className="max-w-2xl mx-auto mb-8 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => router.push('/profile')}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Create your profile and have your professional network verified to get access
                            </AlertDescription>
                          </Alert>
                        ) : userApplied === true ? (
                          <>
                            {/* Search Bar */}
                            <div className="max-w-md mx-auto relative mb-8">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
                          <Input
                            type="text"
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setShowDropdown(e.target.value.length > 0);
                            }}
                            onFocus={() => setShowDropdown(searchQuery.length > 0)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            className="pl-10 pr-4 py-2 w-full rounded-full border-neutral-200 focus:border-black focus:ring-black"
                          />
                          
                          {/* Search Results Dropdown */}
                          {showDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                              {searchResults.length > 0 && (
                                <>
                                  {searchResults.map((profile) => (
                                    <div
                                      key={profile.id}
                                      onClick={() => handleSearchResultClick(profile)}
                                      className="flex items-center gap-3 p-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100"
                                    >
                                      <ProfileAvatar
                                        name={`${profile.first_name} ${profile.last_name}`}
                                        imageUrl={profile.profile_image_url || undefined}
                                        size={32}
                                        editable={false}
                                        className="w-8 h-8 rounded-full flex-shrink-0"
                                      />
                                      <div className="flex-1 text-left">
                                        <div className="font-medium text-neutral-900">
                                          {profile.first_name} {profile.last_name}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
                              
                              {/* Refer Someone New Option */}
                              <div
                                onClick={() => {
                                  setShowDropdown(false);
                                  setShowReferralDialog(true);
                                }}
                                className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer border-t border-neutral-200 bg-neutral-50"
                              >
                                <Users className="w-4 h-4" />
                                <div className="flex-1 text-left">
                                  <div className="font-medium">
                                    Refer Someone to The Niche
                                  </div>
                                  <div className="text-sm text-neutral-500">
                                    We are personal referral only and we will verify if your referral is a good fit for our partner companies!
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                          <Button 
                            variant="outline" 
                            size="lg"
                            className="inline-flex items-center gap-2 rounded-full border-neutral-300 text-neutral-700 hover:border-black hover:text-black transition-all duration-200"
                            onClick={() => setShowReferralDialog(true)}
                          >
                            <Users className="w-2.5 h-2.5 " />
                            Refer Someone to The Niche
                          </Button>

                          <Button 
                            variant="outline" 
                            size="lg"
                            className="inline-flex items-center gap-2 rounded-full border-neutral-300 text-neutral-700 hover:border-black hover:text-black transition-all duration-200"
                            onClick={() => setViewProfileGrid(true)}
                          >
                            <Users className="w-4 h-4" />
                            Peruse Our Entire Network Grid on The Niche
                          </Button>
                        </div>

                        {/* Tabbed Connections Section */}
                        <VerificationProtectedContent 
                          sectionTitle="Your Network"
                          fallbackTitle="Verification Required for Network Access"
                          fallbackDescription="Request to join The Niche network to view and manage your professional connections"
                          className="w-full max-w-6xl mx-auto mt-12"
                          hideWhenNotVerified={false}
                        >
                          <div className="w-full">
                            {/* Tab Navigation */}
                            <div className="flex border-b border-neutral-200 mb-8">
                              <button
                                onClick={() => setActiveTab('connections')}
                                className={`px-6 py-3 text-base font-medium transition-colors duration-200 border-b-2 ${
                                  activeTab === 'connections'
                                    ? 'border-black text-black'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                              >
                                Connections ({verifiedConnectionProfiles.length})
                              </button>
                              <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-6 py-3 text-base font-medium transition-colors duration-200 border-b-2 ${
                                  activeTab === 'pending'
                                    ? 'border-black text-black'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                              >
                                Your Pending Connections ({userPendingConnectionProfiles.length})
                              </button>
                              <button
                                onClick={() => setActiveTab('requested')}
                                className={`px-6 py-3 text-base font-medium transition-colors duration-200 border-b-2 ${
                                  activeTab === 'requested'
                                    ? 'border-black text-black'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                              >
                                Your Requested Connections ({userRequestedConnectionProfiles.length})
                              </button>
                            </div>

                            {/* Tab Content */}
                            <div className="min-h-[400px]">
                              {activeTab === 'connections' && (
                                <>
                                  {verifiedConnectionProfiles.length > 0 ? (
                                    <div className="space-y-4">
                                      {verifiedConnectionProfiles.map(([profile, rating]) => (
                                        <ProfileCard 
                                          key={profile.id} 
                                          profile={profile} 
                                          onClick={() => handleProfileClick(profile)}
                                          connectionStatus="connected"
                                          connectionRating={rating || undefined}
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-neutral-600">
                                      <Users className="mx-auto h-12 w-12 mb-4 text-neutral-400" />
                                      <p>No verified connections yet. Start connecting with professionals in your network!</p>
                                    </div>
                                  )}
                                </>
                              )}

                              {activeTab === 'pending' && (
                                <>
                                  {userPendingConnectionProfiles.length > 0 ? (
                                    <div className="space-y-4">
                                      {userPendingConnectionProfiles.map((profile) => (
                                        <ProfileCard 
                                          key={profile.id} 
                                          profile={profile} 
                                          onClick={() => handleProfileClick(profile)}
                                          connectionStatus="pending_sent"
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-neutral-600">
                                      <AlertCircle className="mx-auto h-12 w-12 mb-4 text-neutral-400" />
                                      <p>No pending connection requests. Search and connect with professionals above!</p>
                                    </div>
                                  )}
                                </>
                              )}

                              {activeTab === 'requested' && (
                                <>
                                  {userRequestedConnectionProfiles.length > 0 ? (
                                    <div className="space-y-4">
                                      {userRequestedConnectionProfiles.map((profile) => (
                                        <ProfileCard 
                                          key={profile.id} 
                                          profile={profile} 
                                          onClick={() => handleProfileClick(profile)}
                                          connectionStatus="requested"
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-neutral-600">
                                      <UserPlus className="mx-auto h-12 w-12 mb-4 text-neutral-400" />
                                      <p>No incoming connection requests at this time.</p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </VerificationProtectedContent>

                                            
                          </>
                        ) : null}
                    </div>
                </div>
            )}
            {viewProfileGrid && !isLoading && userApplied && (
              <div className="max-w-6xl mx-auto py-8 md:py-16 px-4 md:px-6">
                {/* Header with Search */}
                <div className="mb-10">
                <div className="text-center pt-16 pb-8">
                        <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-black">
                            Your Niche Network
                        </h1>
                        </div>
                  
                  {/* Grid Search Bar */}
                  <div className="max-w-md mx-auto relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
                    <Input
                      type="text"
                      placeholder="Filter by name..."
                      value={gridSearchQuery}
                      onChange={(e) => setGridSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full rounded-lg border-neutral-200 focus:border-black focus:ring-black"
                    />
                  </div>
                </div>

                {/* Profiles List */}
                <div className="space-y-4">
                  {filteredGridProfiles.map((profile) => (
                    <ProfileCard 
                      key={profile.id} 
                      profile={profile} 
                      onClick={() => handleProfileClick(profile)}
                      connectionStatus={getConnectionStatus(profile)}
                    />
                  ))}
                </div>

                {/* Empty state */}
                {filteredGridProfiles.length === 0 && !gridSearchQuery && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                    <h3 className="text-lg font-medium text-neutral-600 mb-2">No profiles available</h3>
                    <p className="text-neutral-500">Check back later for new network members.</p>
                  </div>
                )}

                {/* No search results */}
                {filteredGridProfiles.length === 0 && gridSearchQuery && (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                    <h3 className="text-lg font-medium text-neutral-600 mb-2">No matches found</h3>
                    <p className="text-neutral-500">Try adjusting your search terms.</p>
                  </div>
                )}
              </div>
            )}
            {isLoading && (
                <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-sm font-medium text-neutral-700">Loading your network database</p>
                </div>
            )}
          </div> 
        </div>
      </Container>

      {/* Referral Dialog */}
      <ReferralDialog 
        open={showReferralDialog}
        onOpenChange={setShowReferralDialog}
      />
    </div>
  );
}