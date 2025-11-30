import { Skeleton } from "@/components/ui/skeleton";
import { ReferralWithProfile } from "@/app/types";
import { useRouter } from "next/navigation";
import { encodeSimple } from "@/app/utils/simple-hash";
import ProfileCard from "../profile_card";

export function ReferralsTab({
  isExternalView,
  firstName,
  userReferrals,
  loadingReferrals,
  router,
}: {
  isExternalView?: boolean;
  firstName?: string | null;
  userReferrals: ReferralWithProfile[];
  loadingReferrals: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-900">Your Referrals</h3>
      </div>
      {loadingReferrals ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ) : userReferrals.length > 0 ? (
        <div className="space-y-4">
          {userReferrals.map(referral =>
            referral.subscriber_profile ? (
              <ProfileCard
                key={referral.id}
                profile={referral.subscriber_profile}
                onClick={() => {
                  if (referral.subscriber_profile?.id) {
                    const encodedId = encodeSimple(referral.subscriber_profile.id);
                    router.push(`/people/${encodedId}`);
                  }
                }}
                connectionStatus="connected"
              />
            ) : (
              <div
                key={referral.id}
                className="bg-white border border-neutral-200 rounded-2xl p-6"
              >
                {/* ... same inner JSX as you already have ... */}
              </div>
            )
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500">
          {isExternalView
            ? `${firstName} hasn't referred anyone yet.`
            : "You haven't referred anyone yet."}
        </div>
      )}
    </div>
  );
}
