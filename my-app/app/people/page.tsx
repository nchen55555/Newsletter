'use client'
import { Container } from "@/app/components/container";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { ProfileData, ConnectionData } from "@/app/types";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Users, ChevronDown } from "lucide-react";
import ProfileCard from "@/app/components/profile_card";
import { encodeSimple } from "@/app/utils/simple-hash";
import { InformationDialog } from "../components/information-dialog";
import { ConnectionBreakdownChart } from "../components/connection-breakdown-chart";
import { ProfessionalReputationCard } from "../components/professional_reputation_card";

// Loading Skeleton for entire page
// function LoadingSkeleton() {
//   return (
//     <SidebarLayout title="People">
//       <Container>
//         <div className="py-8">
//           {/* Header Section Skeleton */}
//           <div className="mb-8">
//             <Skeleton />
//             <Skeleton/>
//           </div>
//         </div>
//       </Container>
//     </SidebarLayout>
//   );
// }

export default function PeoplePage() {
  const [allProfiles, setAllProfiles] = useState<[ProfileData] | null>(null);
  const [verifiedConnections, setVerifiedConnections] = useState<ConnectionData[]>([]);
  const [pendingConnections, setPendingConnections] = useState<ConnectionData[]>([]);
  const [requestedConnections, setRequestedConnections] = useState<ConnectionData[]>([]);
  const [showMoreVerifiedConnections, setShowMoreVerifiedConnections] = useState(false);

  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [connectionsLoaded, setConnectionsLoaded] = useState(false);

  const [showInformationDialog, setShowInformationDialog] = useState(false);

  const router = useRouter();

  // Actual loading state based on data
  const isLoading = !profilesLoaded || !connectionsLoaded;

  useEffect(() => {
    // Fetch all profiles
    fetch("/api/get_cohort", { credentials: "include" })
      .then(res => res.json())
      .then(data => data.profiles)
      .then(profiles => {
        setAllProfiles(profiles);
        setProfilesLoaded(true);
      })
      .catch(error => {
        console.error("Failed to fetch profiles:", error);
        setProfilesLoaded(true);
      });

    // Fetch user's connections and applied status
    fetch("/api/get_profile", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setVerifiedConnections(data.connections_new || []);
        setPendingConnections(data.pending_connections_new || []);
        setRequestedConnections(data.requested_connections_new || []);
        setShowInformationDialog((data.connections_new || []).length < 5);
        setConnectionsLoaded(true);
      })
      .catch(error => {
        console.error("Failed to fetch user profile:", error);
        setVerifiedConnections([]);
        setPendingConnections([]);
        setRequestedConnections([]);
        setConnectionsLoaded(true);
      });
  }, []);

  const handleProfileClick = (profile: ProfileData) => {
    router.push(`/people/${encodeSimple(profile.id)}`);
  };

  // Get connection status between current user and another profileu
  // Filter verified connections (must be mutual) - returns array of tuples [profile, rating]
  const verifiedConnectionProfiles = allProfiles?.filter(profile => {
    const hasNames = profile.first_name &&
                    profile.last_name &&
                    profile.first_name.trim() !== '' &&
                    profile.last_name.trim() !== '';

    const isConnected = verifiedConnections.some((conn: ConnectionData) => conn.connect_id === profile.id);
    return hasNames && isConnected;
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
    return (
      <SidebarLayout title="People">
      <Container>
      <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mb-4"></div>
          <p className="text-sm font-medium text-neutral-700">Loading your people database</p>
      </div>
      </Container>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="People">
      <Container>
        <div className="py-8">
          <div className="animate-in fade-in-50 duration-700">

              <>
              {/* Network Breakdown Section */}
              <div className="mb-12">
                <h2 className="text-xl font-semibold mb-6 text-foreground">
                  Network Insights
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1">
                    <ConnectionBreakdownChart connections={verifiedConnections} />
                  </div>
                  <div className="lg:col-span-3">
                    <ProfessionalReputationCard connections={verifiedConnections} />
                  </div>
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-xl font-semibold mb-6 text-foreground">
                  your pending niche requests ({userRequestedConnectionProfiles.length})
                </h2>
              {userRequestedConnectionProfiles.length > 0 ? (
                  <div className="mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userRequestedConnectionProfiles.slice(0, 6).map((profile) => (
                        <ProfileCard
                          key={profile.id}
                          profile={profile}
                          onClick={() => handleProfileClick(profile)}
                          connectionStatus="requested"
                        />
                      ))}
                    </div>
                  </div>
                ) : 
                  <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
                    <Users className="mx-auto h-12 w-12 mb-4 text-neutral-400" />
                    <p className="text-muted-foreground">no pending requests yet!</p>
                  </div>
                  }
                </div>
                
                {/* Verified Connections Section */}
                <div className="mb-12">
                  <h2 className="text-xl font-semibold mb-6 text-foreground">
                    your verified niche network ({verifiedConnectionProfiles.length})
                  </h2>
                  {verifiedConnectionProfiles.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {verifiedConnectionProfiles.slice(0, showMoreVerifiedConnections ? 18 : 6).map(([profile, rating]) => (
                          <ProfileCard
                            key={profile.id}
                            profile={profile}
                            onClick={() => handleProfileClick(profile)}
                            connectionStatus="connected"
                            connectionRating={rating || undefined}
                          />
                        ))}
                      </div>
                      {verifiedConnectionProfiles.length > 6 && (
                        <div
                          className="mt-6 text-center cursor-pointer hover:text-neutral-700 transition-colors"
                          onClick={() => setShowMoreVerifiedConnections(!showMoreVerifiedConnections)}
                        >
                          <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                            <span>{showMoreVerifiedConnections ? 'Show less' : 'Load more connections'}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showMoreVerifiedConnections ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
                      <Users className="mx-auto h-12 w-12 mb-4 text-neutral-400" />
                      <p className="text-muted-foreground">No verified connections yet. Start connecting with professionals in your network!</p>
                    </div>
                  )}
                </div>

                {/* Requested Connections Section */}
                <div className="mb-12">
                <h2 className="text-xl font-semibold mb-6 text-foreground">
                  the requests still pending that you&apos;ve sent ({userPendingConnectionProfiles.length})
                </h2>
              {userPendingConnectionProfiles.length > 0 ? (
                  <div className="mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userPendingConnectionProfiles.slice(0, 6).map((profile) => (
                        <ProfileCard
                          key={profile.id}
                          profile={profile}
                          onClick={() => handleProfileClick(profile)}
                          connectionStatus="pending_sent"
                        />
                      ))}
                    </div>
                  </div>
                ) : 
                  <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
                    <Users className="mx-auto h-12 w-12 mb-4 text-neutral-400" />
                    <p className="text-muted-foreground">no requests sent yet!</p>
                  </div>
                  }
                </div>
              </>
          </div>
        </div>
        <InformationDialog
          open={showInformationDialog}
          onOpenChange={setShowInformationDialog}
          title="Map Your Inner Circle"
          description="Digitalize the Connections That Have Shaped Your Career Trajectory"
        >
          <div className="space-y-4">
            <p className="text-foreground">
            Build out a highly-personalized professional network by contextualizing each relationship. The Niche shows you which opportunities your most trusted networks are already looking at or have vetted, personalized to your interests. 
            </p>
            <ol className="list-decimal list-inside space-y-3 text-foreground">
              <li>
                <span className="font-medium">Contextualize Your Relationships</span> by connecting with your most trusted professional contacts
              </li>
              <li>
                <span className="font-medium">See the Professional Reputation You&apos;ve Built</span> - with 5+ connections, we explain to you the network and perception you have built 
              </li>
              <li>
                <span className="font-medium">Discover Personalized Opportunities</span> vetted and verified by your network
              </li>
            </ol>
            <p className="text-sm text-muted-foreground">
              Your profile is your curated professional presence, digitializing the connections that pave your career and surfacing the opportunities that will take you to the next level.
            </p>
          </div>
        </InformationDialog>
      </Container>
    </SidebarLayout>
  );
}