'use client'
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import { ProfileData } from "@/app/types";
import React, { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, AlertCircle } from "lucide-react";
import ProfileAvatar from "@/app/components/profile_avatar";
import { encodeSimple } from "@/app/utils/simple-hash";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ProfileCard({ profile, onClick, isConnected = false }: { profile: ProfileData; onClick: () => void; isConnected?: boolean }) {

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="bg-white border border-neutral-200 rounded-2xl hover:shadow-lg transition-all duration-300 p-8 h-full relative">
        {/* Connected Tag */}
        
        {/* Profile Image */}
        <div className="flex justify-center items-center mb-6">
          <ProfileAvatar
            name={`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'User'}
            imageUrl={profile.profile_image_url || undefined}
            size={128}
            editable={false}
            className="w-32 h-32 rounded-full transition-all duration-300"
          />
        </div>
        
        {/* Name */}
        <h3 className="text-xl font-semibold text-neutral-900 mb-2 text-center">
          {profile.first_name} {profile.last_name}
        </h3>
        {isConnected && (
          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium inline-block mt-2">
            Connected
          </div>
        )}
  
      </div>
    </div>
  );
}



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

          {/* Profiles Grid Skeleton */}
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
  const [verifiedConnections, setVerifiedConnections] = useState<number[]>([]);
  const [userApplied, setUserApplied] = useState<boolean | null>(null);


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
        setVerifiedConnections(data.connections || []);
        setUserApplied(data.applied || false);
      })
      .catch(error => {
        console.error("Failed to fetch user profile:", error);
        setVerifiedConnections([]);
        setUserApplied(false);
      });
  }, []);

  const handleProfileClick = (profile: ProfileData) => {
    router.push(`/people/${encodeSimple(profile.id)}`);
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

  // Filter verified connections
  const verifiedConnectionProfiles = allProfiles?.filter(profile => {
    const hasNames = profile.first_name && 
                    profile.last_name && 
                    profile.first_name.trim() !== '' && 
                    profile.last_name.trim() !== '';
    
    return hasNames && verifiedConnections.includes(profile.id);
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
                            The Niche Network
                        </h1>
                        <p className="text-lg md:text-xl text-neutral-600 leading-relaxed font-light max-w-5xl mx-auto mb-8">
                            Curate a personalized and verified network on The Niche with others who have adopted this public beta. Search for people in The Niche network and verify your connection with an email and/or phone # verification. Verified networks allow us to better match you with opportunities, indexing on what your personalized network has also been interested in. 
                        </p>
                        
                        {/* Show content based on application status */}
                        {userApplied === false ? (
                          <Alert className="max-w-2xl mx-auto mb-8">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              You must have submitted your profile to The Niche to access the network.
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
                          {showDropdown && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                              {searchResults.map((profile) => (
                                <div
                                  key={profile.id}
                                  onClick={() => handleSearchResultClick(profile)}
                                  className="flex items-center gap-3 p-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-b-0"
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
                            </div>
                          )}
                        </div>

                        <Button 
                              variant="outline" 
                              size="lg"
                              className="inline-flex items-center gap-2 rounded-full border-neutral-300 text-neutral-700 hover:border-black hover:text-black transition-all duration-200 mt-8"
                              onClick={() => setViewProfileGrid(true)}
                            >
                              <Users className="w-4 h-4" />
                              Peruse Our Entire Network Grid on The Niche
                            </Button>
                        
                        {/* Verified Connections Section */}
                        {verifiedConnectionProfiles.length > 0 && (
                          <div className="w-full max-w-6xl mx-auto mt-12">
                            <h2 className="text-2xl font-semibold mb-6 text-center text-neutral-900">
                              Your Verified Connections
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {verifiedConnectionProfiles.map((profile) => (
                                <ProfileCard 
                                  key={profile.id} 
                                  profile={profile} 
                                  onClick={() => handleProfileClick(profile)}
                                  isConnected={true}
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
                            The Niche Network
                        </h1>
                        <p className="text-lg md:text-xl text-neutral-600 leading-relaxed font-light max-w-5xl mx-auto mb-8">
                            Curate a personalized and verified network on The Niche with others who have adopted this public beta. Search for people in The Niche network and verify your connection with an email and/or phone # verification. Verified networks allow us to better match you with opportunities, indexing on what your personalized network has also been interested in. 
                        </p>
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

                {/* Profiles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                  {filteredGridProfiles.map((profile) => (
                    <ProfileCard 
                      key={profile.id} 
                      profile={profile} 
                      onClick={() => handleProfileClick(profile)}
                      isConnected={verifiedConnections.includes(profile.id)}
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
    </div>
  );
}