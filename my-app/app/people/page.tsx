'use client'
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import { ProfileData, ConnectionData } from "@/app/types";
import React, { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, AlertCircle, UserPlus, CheckCircle2Icon, Terminal } from "lucide-react";
import ProfileAvatar from "@/app/components/profile_avatar";
import ProfileCard from "@/app/components/profile_card";
import { encodeSimple } from "@/app/utils/simple-hash";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DialogDescription } from "@radix-ui/react-dialog";




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
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
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
  const [referralName, setReferralName] = useState("");
  const [referralEmail, setReferralEmail] = useState("");
  const [referralBackground, setReferralBackground] = useState("");
  const [referralFormError, setReferralFormError] = useState<string | null>(null);
  const [referralFormSuccess, setReferralFormSuccess] = useState(false);
  const [userApplied, setUserApplied] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [referrerName, setReferrerName] = useState<string>("");


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
        setReferrerName(`${data.first_name} ${data.last_name}`);
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

  const handleReferralFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReferralFormError(null);
    setReferralFormSuccess(false);

    if (!referralEmail || !referralBackground) {
      setReferralFormError("Please fill in all required fields.");
      return;
    }

    try {
      const res = await fetch('/api/post_referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: referrerName,
          referralName: referralName,
          referralEmail: referralEmail,
          referralBackground: referralBackground,
          id: currentUserId
        }),
      });

      if (res.ok) {
        setReferralFormSuccess(true);
        setReferralEmail("");
        setReferralBackground("");
      } else {
        setReferralFormError("Failed to submit referral. Please try again.");
      }
    } catch (error) {
      setReferralFormError(`An error occurred. Please try again. ${error}`);
    }
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

  // Filter verified connections (must be mutual)
  const verifiedConnectionProfiles = allProfiles?.filter(profile => {
    const hasNames = profile.first_name && 
                    profile.last_name && 
                    profile.first_name.trim() !== '' && 
                    profile.last_name.trim() !== '';
    
    return hasNames && isMutuallyConnected(profile);
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
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
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
                            Curate a personalized and verified professional network on The Niche by connecting and verifying your connection with email and/or phone number. We utilize your network to allow us to better match you with opportunities custom-tailored to not only your interests but the interests of those in your verified, professional network. 
                            <br></br><br></br>
                            <strong>Access to The Niche is strictly through referral to create a curated network within this public beta. </strong>
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
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 flex items-center justify-center flex-shrink-0">
                                  <UserPlus className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="font-medium">
                                    Refer Someone to Your Professional Network
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
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 flex items-center justify-center">
                              <UserPlus className="w-2.5 h-2.5 text-white" />
                            </div>
                            Refer Someone to Your Professional Network
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
                        
                        {/* Verified Connections Section */}
                        {verifiedConnectionProfiles.length > 0 && (
                          <div className="w-full max-w-6xl mx-auto mt-12">
                            <h2 className="text-2xl font-semibold mb-6 text-center text-neutral-900">
                              Your Verified Connections
                            </h2>
                            <div className="space-y-4">
                              {verifiedConnectionProfiles.map((profile) => (
                                <ProfileCard 
                                  key={profile.id} 
                                  profile={profile} 
                                  onClick={() => handleProfileClick(profile)}
                                  connectionStatus="connected"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                      

                        {/* User's Pending Connections Section */}
                        {userPendingConnectionProfiles.length > 0 && (
                          <div className="w-full max-w-6xl mx-auto mt-12">
                            <h2 className="text-2xl font-semibold mb-6 text-center text-neutral-900">
                              Your Pending Requests to Others
                            </h2>
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
                          </div>
                        )}

                        {/* User's Requested Connections Section */}
                        {userRequestedConnectionProfiles.length > 0 && (
                          <div className="w-full max-w-6xl mx-auto mt-12">
                            <h2 className="text-2xl font-semibold mb-6 text-center text-neutral-900">
                              People Requesting To Connect with You
                            </h2>
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
                          </div>
                        )}
                                            
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
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogTrigger asChild>
          <span style={{ display: 'none' }} />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] p-8" showCloseButton={false}>
          <DialogHeader className="mb-8">
            <DialogTitle className="text-2xl font-semibold">Refer Someone You Want to Bring To Your Verified Professional Network</DialogTitle>
            <DialogDescription  className="text-neutral-600 mt-2">
              We are personal referral only and will verify if your referral is a good fit for our partner companies!
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReferralFormSubmit}>
            <div className="grid gap-8">
              <div className="grid gap-2">
                <Label htmlFor="referralName" className="text-base font-medium">Name *</Label>
                <Input 
                  id="referralName" 
                  name="referralName"
                  type="name"
                  value={referralName} 
                  onChange={(e) => setReferralName(e.target.value)}
                  placeholder="Jane Doe"
                  className="h-12 text-lg px-4" 
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="referralEmail" className="text-base font-medium">Email *</Label>
                <Input 
                  id="referralEmail" 
                  name="referralEmail"
                  type="email"
                  value={referralEmail} 
                  onChange={(e) => setReferralEmail(e.target.value)}
                  placeholder="person@email.com"
                  className="h-12 text-lg px-4" 
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="referralBackground" className="text-base font-medium">How Do You Know Them?</Label>
                <Input
                  id="referralBackground"
                  name="referralBackground"
                  value={referralBackground}
                  onChange={(e) => setReferralBackground(e.target.value)}
                  placeholder="Group project partner, former colleague at ..."
                  className="h-12 text-lg px-4"
                  required
                />
              </div>
              {referralFormSuccess && (
                <Alert>
                  <CheckCircle2Icon />
                  <AlertTitle className="break-words whitespace-normal">Referral submitted successfully! We&apos;ll review and reach out to them if they&apos;re a good fit.</AlertTitle>
                </Alert>
              )}
              {referralFormError && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>{referralFormError}</AlertTitle>
                </Alert>
              )}
            </div>
            <DialogFooter className="mt-8 gap-4">
              <Button type="submit" className="h-12 px-8 text-lg">Submit Referral</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}