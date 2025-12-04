import { ProfileData } from "@/app/types";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileCard from "../profile_card";
import { encodeSimple } from "@/app/utils/simple-hash";
import { useRouter } from "next/navigation";

type NetworkProfile = ProfileData & {
  networkSimilarity?: number;
};

export function NetworkSimilarityTab({
  isExternalView,
  firstName,
  userNetwork,
  loadingNetwork,
}: {
  isExternalView?: boolean;
  firstName?: string | null;
  userNetwork: NetworkProfile[];
  loadingNetwork: boolean;
}) {
  const displayName = firstName || "This candidate";
  const router = useRouter();


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-900">Network Similarity (85% Match)</h3>
      </div>
      <p className="text-sm text-neutral-600">
        These are candidates whose overall network position looks most similar to {displayName}&apos;s, 
        based on who they&apos;re connected to, how others view them, and how they sit inside the broader community.
      </p>

      {loadingNetwork ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : userNetwork.length > 0 ? (
        <div className="space-y-4">
          {userNetwork.map((profile) => (
            <div key={profile.id ?? `${profile.email}-${profile.first_name}`} className="space-y-2">
              <ProfileCard
                profile={profile}
                tags={
                  typeof profile.networkSimilarity === "number"
                    ? [`Network positioning similarity: ${(profile.networkSimilarity * 100).toFixed(1)}%`]
                    : undefined
                }
                connectionRating={profile.connectionRating}
                onClick={() => {
                  if (profile.id) {
                    const encodedId = encodeSimple(profile.id);
                    router.push(`/external_profile/${encodedId}`);
                  }
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500">
          {isExternalView
            ? `${displayName} doesn't have any close network matches yet.`
            : "We don't see any candidates that match {displayName}'s network position to the 85% threshold."}
        </div>
      )}
    </div>
  );
}


