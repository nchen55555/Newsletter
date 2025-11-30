"use client"

import ProfileAvatar from "../profile_avatar";
import type { SimilarDeveloper } from "../external_profile";
import { useRouter } from "next/navigation";
import { encodeSimple } from "@/app/utils/simple-hash";

export function SimilarRepoMatchCard({
  developer,
  matchedRepo,
  clientId,
}: {
  developer: SimilarDeveloper;
  matchedRepo: string;
  clientId?: number | null;
}) {
  const fallbackName =
    developer.user.name || developer.user.username || developer.user.email;
  const router = useRouter();

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    try {
      const encodedCandidateId = encodeSimple(developer.subscriberId);

      if (clientId) {
        const encodedClientId = encodeSimple(clientId);
        router.push(`/external_profile/${encodedCandidateId}_${encodedClientId}`);
      } else {
        router.push(`/external_profile/${encodedCandidateId}`);
      }
    } catch {
      // Fail silently if encoding/navigation fails
    }
  };

  return (
    <div
      className="min-w-0 border border-neutral-200 rounded-lg p-3 md:basis-1/3 md:max-w-[33%] cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <div className="text-xs font-medium text-neutral-800 truncate">
        {matchedRepo}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <ProfileAvatar
          name={fallbackName}
          imageUrl={developer.user.avatar_url || undefined}
          size={32}
          editable={false}
          className="w-8 h-8 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-neutral-900 truncate">
            {fallbackName}
          </div>
        </div>
      </div>
    </div>
  );
}


