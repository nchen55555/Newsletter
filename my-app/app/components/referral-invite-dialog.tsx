"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSearchParams } from "next/navigation";
import { decodeSimple } from "@/app/utils/simple-hash";
import { Subscribe } from "./subscribe";
import Image from "next/image";
import ProfileAvatar from "./profile_avatar";
import Link from "next/link";

interface ReferralInviteDialogProps {
  companyName?: string;
}

export function ReferralInviteDialog({companyName }: ReferralInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [referrerName, setReferrerName] = useState<string>("");
  const [referrerProfileImage, setReferrerProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const searchParams = useSearchParams();

   // Calculate referrer ID directly from URL (memoized) - this is the encoded ID for linking
  const referrerIdFromUrl = useMemo(() => {
    const refParam = searchParams.get('referral_id');
    if (!refParam) return undefined;
    
    try {
      const referrerUserId = decodeSimple(refParam);
      const result = (referrerUserId && referrerUserId > 0) ? referrerUserId : undefined;
      return result;
    } catch (error) {
      console.error("Failed to decode referral parameter:", error);
      return undefined;
    }
  }, [searchParams]);
  
  // Check login status
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const res = await fetch('/api/get_profile', { credentials: 'include' });
        
        if (res.ok) {
          const data = await res.json();
          
          // Check if user is subscribed (has valid profile) and has required fields
          const hasValidProfile = data && data.isSubscribed && data.id && data.email;
          setIsLoggedIn(hasValidProfile);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  useEffect(() => {
    // Check if there's a referral parameter in the URL
    const refParam = searchParams.get('ref');
    if (!refParam) {
      setLoading(false);
      return;
    }

    // Decode the referrer's user ID
    try {
      const referrerUserId = decodeSimple(refParam);
      
      // Check if we have a valid user ID
      if (!referrerUserId || referrerUserId <= 0) {
        setReferrerName("");
        setLoading(false);
        return;
      }
      
      // Fetch the referrer's profile information
      const fetchReferrerProfile = async () => {
        try {
          const res = await fetch(`/api/get_user_profile?user_id=${referrerUserId}`);
          if (res.ok) {
            const profile = await res.json();
            const firstName = profile.first_name;
            const lastName = profile.last_name;
            if (firstName || lastName) {
              setReferrerName(`${firstName}${lastName ? ' ' + lastName : ''}`);
            } else {
              setReferrerName("");
            }
            // Store profile image for avatar
            if (profile.profile_image_url) {
              setReferrerProfileImage(profile.profile_image_url);
            }
          } else {
            setReferrerName("");
          }
        } catch (error) {
          console.error("Failed to fetch referrer profile:", error);
          setReferrerName("");
        } finally {
          setLoading(false);
        }
      };

      fetchReferrerProfile();
    } catch (error) {
      console.error("Failed to decode referral parameter:", error);
      setReferrerName("");
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    // Wait for both loading states to complete
    if (loading || isLoggedIn === null) return;

    // Show dialog if there's a referrer (from URL param)
    if (referrerName) {
      setOpen(true);
    }
  }, [loading, referrerName, isLoggedIn]);


  // Don't render if still loading login status
  if (isLoggedIn === null) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="text-center">
          {referrerName && (
            <Link
              href={`/profile/${searchParams.get('referral_id')}`}
              className="flex items-center justify-center gap-3 mb-4 hover:opacity-80 transition-opacity"
            >
              <ProfileAvatar
                name={referrerName}
                imageUrl={referrerProfileImage || undefined}
                size={48}
                editable={false}
                className="ring-2 ring-neutral-200"
              />
              <div className="text-left">
                <p className="text-sm text-neutral-500">Referred by</p>
                <p className="font-semibold text-neutral-200">{referrerName}</p>
              </div>
            </Link>
          )}
          {!referrerName && (
            <div className="flex justify-center mt-4 mb-3">
              <Image
                src="https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/avatar_profiles/theniche.png"
                alt="The Niche Logo"
                width={80}
                height={80}
              />
            </div>
          )}
          <DialogTitle className="text-2xl font-semibold text-center">
            Join The Niche Network
          </DialogTitle>
          {companyName && (
            <div className="mt-3 inline-block px-4 py-2 bg-neutral-100 rounded-full">
              <p className="text-sm">
                Warm intro to <strong>{companyName}</strong> waiting
              </p>
            </div>
          )}
          <DialogDescription className="text-center mt-3 text-base text-neutral-400">
            {referrerName && companyName ? (
              <>
                <strong>{referrerName}</strong> thinks you would be a great fit for{" "}
                <strong>{companyName}</strong> and wants to extend you an invite to use The Niche Network for a warm intro.
              </>
            ) : referrerName ? (
              <>
                Discover opportunities that your most trusted circles are already looking at or have vetted directly and unlock network-driven warm introductions.
              </>
            ) : (
              <>
                Discover opportunities that your most trusted circles are already looking at or have vetted directly and unlock network-driven warm introductions to these opportunities.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6 text-center">
          <Subscribe referral_id={referrerIdFromUrl} />
        </div>

      </DialogContent>
    </Dialog>
  );
}