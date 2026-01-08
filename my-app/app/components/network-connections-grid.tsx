"use client";

import { Users } from "lucide-react";
import ProfileCard from "./profile_card";
import { ProfileData, ConnectionData } from "@/app/types";
import { useRouter } from "next/navigation";
import { encodeSimple } from "@/app/utils/simple-hash";
import { Skeleton } from "@/components/ui/skeleton";

interface NetworkConnectionsGridProps {
  connections: ProfileData[];
  currentUserData?: ProfileData | null;
  className?: string;
  onSeeAllConnections?: () => void;
  showSeeAll?: boolean;
  maxDisplay?: number; // Maximum number of connections to display before showing "See All"
  appliedToTheNiche?: boolean;
  isExternalView?: boolean;
  loading?: boolean;
}

export function NetworkConnectionsGrid({
  connections,
  currentUserData,
  className = "",
  onSeeAllConnections,
  showSeeAll = false,
  maxDisplay = 3,
  appliedToTheNiche = false,
  isExternalView = false,
  loading = false
}: NetworkConnectionsGridProps) {
  const router = useRouter();

  const handleProfileClick = (connection: ProfileData) => {
    router.push(`/people/${encodeSimple(connection.id)}`);
  };

  // Get existing rating for a connection (only from requested_connections_new and connections_new)
  const getExistingRating = (profile: ProfileData): number | undefined => {
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
  const getExistingNote = (profile: ProfileData): string | undefined => {
    if (!currentUserData || !profile || !profile.id) return undefined;

    const userConnections = Array.isArray(currentUserData.connections_new) ? currentUserData.connections_new : [];
    const userPendingConnections = Array.isArray(currentUserData.pending_connections_new) ? currentUserData.pending_connections_new : [];
    const pid = String(profile.id);

    // Check only connections_new and requested_connections_new
    const connection = userConnections.find((conn: ConnectionData) => String(conn.connect_id) === pid)
      || userPendingConnections.find((conn: ConnectionData) => String(conn.connect_id) === pid);

    return connection?.note;
  };

  // If loading, show skeleton
  if (loading) {
    return (
      <div className="space-y-6 rounded-lg p-4">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // If no connections and no see all, show empty state
  if ((!connections || connections.length === 0) && !showSeeAll) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No network connections yet.
      </div>
    );
  }

  // Limit displayed connections
  const displayedConnections = connections.slice(0, maxDisplay);

  return (
    <>
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {/* Existing connections */}
      {displayedConnections.map((connection) => (
        <ProfileCard
          key={connection.id}
          profile={connection}
          onClick={() => handleProfileClick(connection)}
          connectionStatus="connected"
          connectionRating={getExistingRating(connection)}
          initialNote={getExistingNote(connection)}
          size="compact"
          isExternalView={isExternalView}
        />
      ))}
      {/* See All Connections card */}
      {showSeeAll && onSeeAllConnections && (() => {
        // External view logic
        if (isExternalView) {
          if (connections.length === 0) {
            // Show "No Verified Connections Yet"
            return (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 aspect-[4/3] flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <Users className="w-8 h-8 text-gray-400" />
                  <div className="text-sm font-medium text-gray-600">
                    User Has No Verified Connections Yet
                  </div>
                </div>
              </div>
            );
          } else if (connections.length > maxDisplay) {
            // Return empty div
            return <div />;
          } else {
            // connections.length <= maxDisplay && connections.length > 0: don't show card at all
            return null;
          }
        }

        // Non-external view (original logic)
        return (
          <div
            onClick={onSeeAllConnections}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors aspect-[4/3] flex flex-col items-center justify-center"
          >
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <Users className="w-8 h-8 text-gray-400" />
              <div className="text-sm font-medium text-gray-600">
                {connections.length === 0 ? 'Start Curating Your Network' : 'See All Connections'}
              </div>
              <div className="text-xs text-gray-500">
                {!appliedToTheNiche ? 'Activate Your Profile to Start Connecting ' : ''}
                {connections.length > maxDisplay ?
                    `View all ${connections.length} connections` :
                    'Explore network'
                }
              </div>
            </div>
          </div>
        );
      })()}
    </div>
    </>

  );
}