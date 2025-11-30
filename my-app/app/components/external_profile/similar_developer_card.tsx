import { SimilarDeveloper } from "../external_profile";
import ProfileAvatar from "../profile_avatar";
import { useRouter } from "next/navigation";
import { encodeSimple } from "@/app/utils/simple-hash";

// Similar Developer Card Component
const SimilarDeveloperCard = ({
  developer,
  clientId,
}: {
  developer: SimilarDeveloper;
  clientId?: number | null;
}) => {
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
      // silently ignore
    }
  };

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            name={fallbackName}
            imageUrl={developer.user.avatar_url || undefined}
            size={40}
            editable={false}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{fallbackName}</h3>
            <p className="text-sm text-gray-600">@{developer.user.username}</p>
          </div>
        </div>
      </div>


      <div className="space-y-2">
        {developer.repositoryMatches.map((match, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {match.queryRepo}
              </div>
              <div className="text-gray-600 truncate">→ {match.matchedRepo}</div>
            </div>
            <div className="ml-2 text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
              {(match.similarity * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default SimilarDeveloperCard;


