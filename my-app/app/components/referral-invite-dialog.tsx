"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSearchParams } from "next/navigation";
import { decodeSimple } from "@/app/utils/simple-hash";
import { Subscribe } from "./subscribe";
import Image from "next/image";

interface ReferralInviteDialogProps {
  companyName?: string;
}

export function ReferralInviteDialog({companyName }: ReferralInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [referrerName, setReferrerName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const searchParams = useSearchParams();

   // Calculate referrer ID directly from URL (memoized)
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
        console.log("No valid referrer user ID found");
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

  // Set up scroll listener for bottom of page
  useEffect(() => {
    // Wait for login status to be determined before setting up scroll listener
    if (isLoggedIn === null) return;

    console.log('Setting up scroll listener, isLoggedIn:', isLoggedIn);

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check if user has scrolled to within 100px of the bottom
      if (scrollTop + windowHeight >= documentHeight - 100 && !hasScrolledToBottom) {
        setHasScrolledToBottom(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoggedIn, hasScrolledToBottom]);

  useEffect(() => {
    // Wait for both loading states to complete
    if (loading || isLoggedIn === null) return;

    // Show dialog if:
    // 1. There's a referrer (from URL param) - show immediately
    // 2. OR user is not logged in and has scrolled to bottom
    if (referrerName || (isLoggedIn === false && hasScrolledToBottom)) {
      setOpen(true);
    }
  }, [loading, referrerName, isLoggedIn, hasScrolledToBottom]);


  // Don't render if still loading login status
  if (isLoggedIn === null) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="text-center">
          <div className="flex justify-center mt-4 mb-3">
            <Image
              src="https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/avatar_profiles/theniche.png"
              alt="The Niche Logo"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
          <DialogTitle className="text-xl font-semibold text-center">
            {referrerName 
              ? `${referrerName} has shared with you an opportunity`
              : 'Join The Niche Network'
            }
          </DialogTitle>
          <DialogDescription className="text-center mt-3 text-base">
            {referrerName ? (
              <>
                Welcome to The Niche! <strong>{referrerName}</strong> thinks you would be a great fit for{" "}
                <strong>{companyName || `this company`}</strong> and wants to extend you an invite for you to use The Niche Network to for a warm intro there. 
              </>
            ) : (
              <>
                Welcome to The Niche! Discover opportunities that your most trusted circles are already looking at or have vetted directly and unlock network-driven warm introductions to these opportunities. 
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