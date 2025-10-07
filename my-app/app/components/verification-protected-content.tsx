"use client";
import { useState, useEffect } from "react";
import { VerificationRequiredSection } from "./verification-required";

interface VerificationProtectedContentProps {
  children: React.ReactNode;
  sectionTitle?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  className?: string;
  hideWhenNotVerified?: boolean;
}

export function VerificationProtectedContent({ 
  children, 
  sectionTitle = "",
  fallbackTitle = "Request to join The Niche network for access to this content",
  fallbackDescription = "Request to join The Niche network for access to this content",
  className = "",
  hideWhenNotVerified = false
}: VerificationProtectedContentProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState<boolean | null>(null);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const response = await fetch("/api/get_profile", { credentials: "include" });
        if (response.ok) {
          const profile = await response.json();
          setIsVerified(profile.verified || false);
          setHasApplied(profile.applied || false);
        } else {
          setIsVerified(false);
          setHasApplied(false);
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
        setIsVerified(false);
        setHasApplied(false);
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, []);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {sectionTitle && (
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">{sectionTitle}</h2>
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

  if (!isVerified) {
    if ((hideWhenNotVerified && hasApplied) || (!isVerified && !hasApplied)) {
      return (
        <div>
        <VerificationRequiredSection 
          title={fallbackTitle}
          description={fallbackDescription}
          className={className}
        >
          {sectionTitle && (
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">{sectionTitle}</h2>
            </div>
          )}
        </VerificationRequiredSection>
        </div>
      );
    }
  }

  return (
    <div className={className}>
      {sectionTitle && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">{sectionTitle}</h2>
        </div>
      )}
      {children}
    </div>
  );
}