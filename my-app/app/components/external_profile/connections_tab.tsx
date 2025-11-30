import { ProfileData } from "@/app/types";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileCard from "../profile_card";
import { encodeSimple } from "@/app/utils/simple-hash";
import { useRouter } from "next/navigation";

export function ConnectionsTab({
  isExternalView,
  firstName,
  connectionProfiles,
  loadingConnections,
  router,
}: {
  isExternalView?: boolean;
  firstName?: string | null;
  connectionProfiles: ProfileData[];
  loadingConnections: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-900">Network Connections</h3>
      </div>
      {loadingConnections ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : connectionProfiles.length > 0 ? (
        <div className="space-y-4">
          {connectionProfiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onClick={() => {
                if (profile.id) {
                  const encodedId = encodeSimple(profile.id);
                  router.push(`/people/${encodedId}`);
                }
              }}
              connectionStatus="connected"
              connectionRating={profile.connectionRating}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500">
          {isExternalView
            ? `${firstName} hasn't connected with anyone yet.`
            : "You haven't connected with anyone yet."}
        </div>
      )}
    </div>
  );
}
