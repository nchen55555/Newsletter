"use client";

import { useState } from "react";
import { ProfileData } from "@/app/types";
import ProfileAvatar from "@/app/components/profile_avatar";
import {
  type ConnectionStatusType
} from "./connection-status-helpers";
import { ConnectDialog } from "./connect_dialog";
import type { ConnectVerificationStatus } from "./connect_dialog";

function ProfileCard({
  profile,
  onClick,
  connectionStatus = 'none',
  connectionRating,
  size = 'default',
}: {
  profile: ProfileData;
  onClick: () => void;
  connectionStatus?: ConnectionStatusType;
  connectionRating?: number;
  size?: 'default' | 'compact';
}) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [isSubmittingConnect, setIsSubmittingConnect] = useState(false);
  const [connectVerificationStatus, setConnectVerificationStatus] = useState<ConnectVerificationStatus>("idle");
  const [connectStatusMessage, setConnectStatusMessage] = useState("");

  const getConnectionStatus = () => {
    return connectionStatus;
  };

  const getExistingConnectionRating = () => {
    return connectionRating;
  };

  const handleConnectSubmit = async (scaleValue: number, note?: string) => {
    setIsSubmittingConnect(true);
    setConnectVerificationStatus("pending");

    try {
      const response = await fetch("/api/post_connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connect_id: profile.id,
          rating: scaleValue,
          note: note || "",
        }),
        credentials: "include",
      });

      if (response.ok) {
        setConnectVerificationStatus("success");
        setConnectStatusMessage("Connection request sent successfully!");
        setTimeout(() => {
          setShowConnectDialog(false);
          window.location.reload();
        }, 1500);
      } else {
        setConnectVerificationStatus("error");
        setConnectStatusMessage("Failed to send connection request");
      }
    } catch {
      setConnectVerificationStatus("error");
      setConnectStatusMessage("An error occurred");
    } finally {
      setIsSubmittingConnect(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      e.stopPropagation();
      return;
    }
    onClick();
  };

  // Size-based styling
  const cardMinHeight = size === 'compact' ? 'min-h-[300px]' : 'min-h-[400px]';
  const imageHeight = size === 'compact' ? 'h-[200px]' : 'h-[300px]';

  return (
    <div className="group cursor-pointer" onClick={handleCardClick}>
      <div className={`bg-card border border-border rounded-3xl hover:shadow-lg transition-all duration-300 flex flex-col ${cardMinHeight}`}>
        {/* Profile Image - Full width, fixed height */}
        <div className={`w-full ${imageHeight} flex-shrink-0 overflow-hidden rounded-t-3xl`}>
          <ProfileAvatar
            name={`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'User'}
            imageUrl={profile.profile_image_url || undefined}
            size={400}
            shape="square"
            editable={false}
            className="w-full h-full"
          />
        </div>

        {/* Content section - Flexible height */}
        <div className="p-4 flex flex-col flex-1">
          {/* Name with verification badge */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground">
              {profile.first_name} {profile.last_name}
            </h3>
          </div>

          {/* Bio text */}
          {/* <p className="text-neutral-600 text-sm leading-relaxed mb-3 line-clamp-2">
            {profile.bio || getConnectionRatingText() || 'No bio available'}
          </p> */}
          <ConnectDialog
              open={showConnectDialog}
              onOpenChange={setShowConnectDialog}
              firstName={profile.first_name}
              isSubmitting={isSubmittingConnect}
              verificationStatus={connectVerificationStatus}
              statusMessage={connectStatusMessage}
              onSubmit={handleConnectSubmit}
              connectionStatus={getConnectionStatus()}
              existingRating={getExistingConnectionRating()}
              compact={true}
            />
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;