import { Skeleton } from "@/components/ui/skeleton";
import { ReferralWithProfile } from "@/app/types";
import { useRouter } from "next/navigation";
import { encodeSimple } from "@/app/utils/simple-hash";
import ProfileCard from "../profile_card";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ReferralDialog } from "../referral-dialog";

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
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-900">Your Referrals</h3>
        {!isExternalView && (
          <Button
            onClick={() => setShowReferralDialog(true)}
            size="sm"
            className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Refer Someone to the Niche
          </Button>
        )}
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
              <div key={referral.id} className="bg-white border border-neutral-200 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-8 h-8 text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-neutral-900">
                      {referral.referral_name}
                    </h4>
                    <p className="text-sm text-neutral-600">{referral.referral_email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Invitation Sent
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
          {!isExternalView && (
          <ReferralDialog 
            open={showReferralDialog} 
            onOpenChange={setShowReferralDialog}
            title="Refer Someone to The Niche"
            description="We are personal referral only and will verify if your referral is a good fit for our partner companies!"
          />
        )}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500">
          {isExternalView
            ? `${firstName || "This person"} hasn't referred anyone yet.`
            : "You haven't referred anyone yet."}
        </div>
      )}
    </div>
    
  )}
