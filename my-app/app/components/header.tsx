"use client"
import Link from "next/link"
import { NavActions } from "./navActions"
import React, { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { useSubscriptionContext } from "./subscription_context";

export function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isSubscribed, loading: subLoading } = useSubscriptionContext();

  const [profileAlert, setProfileAlert] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true); // ← new
  const [alertRightAlign, setAlertRightAlign] = useState(false);
  const alertRef = React.useRef<HTMLDivElement | null>(null);

  // Measure overflow only when visible
  useEffect(() => {
    if (profileAlert && alertRef.current) {
      const rect = alertRef.current.getBoundingClientRect();
      setAlertRightAlign(rect.right > window.innerWidth);
    }
  }, [profileAlert]);

  // Fetch profile only once subscription state is ready & user is subscribed
  useEffect(() => {
    if (subLoading || !isSubscribed) {
      // If not subscribed, don’t show the alert at all
      setProfileAlert(false);
      setCheckingProfile(false);
      return;
    }

    const ac = new AbortController();
    let didSet = false; // avoid double-set in React Strict Mode (dev)

    (async () => {
      try {
        const res = await fetch("/api/get_profile", {
          credentials: "include",
          cache: "no-store",        // ← avoid stale cache
          signal: ac.signal,
        });
        if (!res.ok) return;
        const profile = await res.json();

        const incomplete =
          !profile.resume_url ||
          !profile.first_name ||
          !profile.last_name ||
          !profile.phone_number ||
          !profile.bio || 
          !profile.linkedin_url ||
          !profile.profile_image_url;

        if (!didSet) setProfileAlert(incomplete);
      } catch (e) {
        console.error("Failed to fetch profile:", e);
        if (!didSet) setProfileAlert(false); // fail-closed
      } finally {
        if (!didSet) setCheckingProfile(false);
      }
    })();

    return () => {
      didSet = true;         // guard against Strict Mode double-invoke
      ac.abort();
    };
  }, [isSubscribed, subLoading]);

  return (
    <nav className="border-b border-neutral-100 bg-white">
      <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-lg font-medium tracking-tight transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">the niche</Link>
        </div>

        <button
          className="md:hidden flex items-center px-2 py-1 border rounded text-neutral-700 border-neutral-300 hover:bg-neutral-100 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-12 text-sm font-medium">
          <Link href="/about" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">about</Link>

          {isSubscribed && (
            <>
              <Link href="/articles" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">portfolio</Link>
              <Link href="/companies" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">companies</Link>
              <Link href="/people" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">people</Link>
            </>
          )}

          <div className="flex items-center gap-4 relative">
            {/* Only render after check finishes to avoid flashing/lingering */}
            {isSubscribed && !checkingProfile && profileAlert && (
              <div
                ref={alertRef}
                className={`absolute top-12 z-50 w-80 ${alertRightAlign ? 'right-0 left-auto ml-0' : 'left-full ml-4'}`}
              >
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                  <AlertTitle>Please update your profile</AlertTitle>
                  <AlertDescription>
                    <ul className="list-inside list-disc text-sm">
                      <li>Your updated profile is necessary to interact with our partner companies</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
            <NavActions />
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden px-8 pb-4 flex flex-col gap-4 text-sm font-medium bg-white border-b border-neutral-100 animate-fade-in-down">
          <Link href="/about" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text" onClick={() => setMenuOpen(false)}>about</Link>
          {isSubscribed && (
            <>
              <Link href="/articles" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text" onClick={() => setMenuOpen(false)}>articles</Link>
              <Link href="/companies" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text" onClick={() => setMenuOpen(false)}>portfolio</Link>
              {/* <Link href="/people" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text" onClick={() => setMenuOpen(false)}>people</Link> */}
            </>
          )}
          <NavActions />
        </div>   
      )}
    </nav>
  );
}
