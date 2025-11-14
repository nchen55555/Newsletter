import { ProfileData } from "@/app/types";
import ProfileAvatar from "@/app/components/profile_avatar";

interface SimilarCandidateCardProps {
  profile: ProfileData;
  onClick: () => void;
  similarityPercentage: number;
}

function SimilarCandidateCard({ profile, onClick, similarityPercentage }: SimilarCandidateCardProps) {
  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="bg-white border border-neutral-200 rounded-2xl hover:shadow-lg transition-all duration-300 p-6 relative flex items-center gap-6 min-h-[120px]">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <ProfileAvatar
            name={`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'User'}
            imageUrl={profile.profile_image_url || undefined}
            size={80}
            editable={false}
            className="w-20 h-20 rounded-full transition-all duration-300"
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="mb-2">
            <h3 className="text-xl font-semibold text-neutral-900">
              {profile.first_name} {profile.last_name}
            </h3>
          </div>
          
          {/* Bio */}
          {profile.bio && (
            <p className="text-neutral-600 text-sm leading-relaxed line-clamp-3 text-left">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Similarity Score - Right Side */}
        <div className="flex-shrink-0 text-right">
          <div className="text-3xl font-bold text-neutral-900">
            {Math.round(similarityPercentage)}%
          </div>
          <div className="text-xs text-neutral-500 uppercase tracking-wide">
            Similar
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimilarCandidateCard;