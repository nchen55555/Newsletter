import { ProfileData } from "@/app/types";
import ProfileAvatar from "@/app/components/profile_avatar";
import { connectionLabels } from "./connection-scale";

function ProfileCard({ profile, onClick, connectionStatus = 'none', connectionRating }: { profile: ProfileData; onClick: () => void; connectionStatus?: 'connected' | 'pending_sent' | 'requested' | 'none'; connectionRating?: number }) {

  const getConnectionBadges = () => {
    const badges = [];
    
    // Connection status badge
    switch (connectionStatus) {
      case 'connected':
        badges.push(
          <div key="status" className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
            Connected
          </div>
        );
        break;
      case 'pending_sent':
        badges.push(
          <div key="status" className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
            Request Sent
          </div>
        );
        break;
      case 'requested':
        badges.push(
          <div key="status" className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
            Requested
          </div>
        );
        break;
    }
    
    // Rating badge (only if we have a rating and connection)
    if (connectionRating && connectionStatus !== 'none') {
      console.log("rating badge", connectionLabels[connectionRating - 1]);
      badges.push(
        <div key="rating" className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
          {connectionLabels[connectionRating - 1]}
        </div>
      );
    }
    
    return badges.length > 0 ? (
      <div className="flex gap-2">
        {badges}
      </div>
    ) : null;
  };

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
          {/* Name and Connection Badge */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-neutral-900">
              {profile.first_name} {profile.last_name}
            </h3>
            {getConnectionBadges()}
          </div>
          
          {/* Bio */}
          {profile.bio && (
            <p className="text-neutral-600 text-sm leading-relaxed line-clamp-3 text-left">
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;