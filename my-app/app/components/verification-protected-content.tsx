"use client";

import { useEffect, useState } from "react";
import { VerificationRequiredSection } from "./verification-required";

interface VerificationProtectedContentProps {
  children: React.ReactNode;
  sectionTitle?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  className?: string;
  redirectUrl?: string;
}

// Protected content wrapper:
// - If the user has *not* applied (`applied === false`), show the fallback.
// - If the user *has* applied (`applied === true`), show the children.
export function VerificationProtectedContent({ 
  children, 
  sectionTitle = "",
  fallbackTitle = "You need a Niche profile to access this content",
  fallbackDescription = "You need a Niche profile to access this content",
  className = "",
  redirectUrl = "/people",
}: VerificationProtectedContentProps) {
  const [hasApplied, setHasApplied] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAppliedStatus = async () => {
      try {
        const response = await fetch("/api/get_profile", { credentials: "include" });
        if (response.ok) {
          const profile = await response.json();
          setHasApplied(!!profile.applied);
        } else {
          setHasApplied(false);
        }
      } catch (error) {
        console.error("Error checking applied status:", error);
        setHasApplied(false);
      } finally {
        setLoading(false);
      }
    };

    checkAppliedStatus();
  }, []);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {sectionTitle && (
          <div>
            <h2 className="text-2xl font-bold text-neutral-200 mb-2">{sectionTitle}</h2>
          </div>
        )}
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  // If user has not applied yet, show the gated fallback
  if (!hasApplied) {
      return (
        <VerificationRequiredSection 
          title={fallbackTitle}
          description={fallbackDescription}
          className={className}
          redirectUrl={redirectUrl}
        >
          {sectionTitle && (
            <div>
              <h2 className="text-2xl font-bold text-neutral-200 mb-2">{sectionTitle}</h2>
            </div>
          )}
        </VerificationRequiredSection>
      );
  }

  // Applied users see the protected content
  return (
    <div className={className}>
      {sectionTitle && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-200 mb-2">{sectionTitle}</h2>
        </div>
      )}
      {children}
    </div>
  );
}