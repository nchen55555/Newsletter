"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSearchParams } from "next/navigation";
import { decodeSimple } from "@/app/utils/simple-hash";
import { Subscribe } from "./subscribe";
import Link from "next/link";

interface ReferralInviteDialogProps {
  companyName?: string;
}

export function ReferralInviteDialog({companyName }: ReferralInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [referrerName, setReferrerName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [referralId, setReferralId] = useState<number | undefined>(undefined);
  const searchParams = useSearchParams();

  // Check login status
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const res = await fetch('/api/get_profile', { credentials: 'include' });
        console.log('Login check response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('Login check response data:', data);
          
          // Check if user is subscribed (has valid profile) and has required fields
          const hasValidProfile = data && data.isSubscribed && data.id && data.email;
          console.log('Has valid profile:', hasValidProfile);
          setIsLoggedIn(hasValidProfile);
        } else {
          console.log('Login check failed with status:', res.status);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
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
        setReferralId(undefined);
        setLoading(false);
        return;
      }
      
      // Set the referral ID for the Subscribe component
      setReferralId(referrerUserId);
      
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
        console.log('User scrolled to bottom, setting hasScrolledToBottom to true');
        setHasScrolledToBottom(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoggedIn, hasScrolledToBottom]);

  useEffect(() => {
    // Wait for both loading states to complete
    if (loading || isLoggedIn === null) return;

    console.log('ReferralInviteDialog conditions:', {
      loading,
      referrerName,
      isLoggedIn,
      hasScrolledToBottom,
      shouldShow: referrerName || (isLoggedIn === false && hasScrolledToBottom)
    });

    // Show dialog if:
    // 1. There's a referrer (from URL param) - show immediately
    // 2. OR user is not logged in and has scrolled to bottom
    if (referrerName || (isLoggedIn === false && hasScrolledToBottom)) {
      console.log('Opening ReferralInviteDialog');
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
          <DialogTitle className="text-xl font-semibold text-center">
            {referrerName 
              ? `${referrerName} has referred you to The Niche`
              : 'Join The Niche Network'
            }
          </DialogTitle>
          <DialogDescription className="text-center mt-3 text-base">
            {referrerName ? (
              <>
                Welcome to The Niche! <strong>{referrerName}</strong> thinks you would be a great fit for{" "}
                <strong>{companyName || `this company`}</strong> and wants to extend you an invite for you to use The Niche Network for a warm intro to the company.
              </>
            ) : (
              <>
                Welcome to The Niche! You could be a great fit for <strong>{companyName || 'this company'}</strong>. Request access to join our network of top talent and get warm intros to startups like this one. <Link href="/" className="text-blue-600 hover:text-blue-800 underline">Learn more</Link>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6 text-center">
          <Subscribe referral_id={referralId} />
        </div>
        
        <p className="text-xs text-neutral-500 text-center mt-4">
          Introductions to opportunities and founders at some of the highest talent density startups.
        </p>
      </DialogContent>
    </Dialog>
  );
}