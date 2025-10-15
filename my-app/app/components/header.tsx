"use client"
import Link from "next/link"
import { NavActions } from "./navActions"
import React, { useEffect, useState } from "react";
import { useSubscriptionContext } from "./subscription_context";

export function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isSubscribed, loading: subLoading } = useSubscriptionContext();

  const [requestedConnectionsCount, setRequestedConnectionsCount] = useState(0);

  // Fetch profile only once subscription state is ready & user is subscribed
  useEffect(() => {
    if (subLoading || !isSubscribed) {
      // If not subscribed, don’t show the alert at all
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

        if (!didSet) {
          const requestedConnections = profile.requested_connections_new || [];
          setRequestedConnectionsCount(requestedConnections.length);
        }
      } catch (e) {
        console.error("Failed to fetch profile:", e);      
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
          {!isSubscribed && (
          <Link href="/privacy" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">privacy policy</Link>)
          }
          {isSubscribed && (
            <>
            <Link href="/opportunities" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">opportunities</Link>
            <Link href="/articles" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">feed</Link>
            <Link href="/ats" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">ats</Link>
            <div className="relative inline-block">
              <Link href="/people" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">
                people
              </Link>
              {requestedConnectionsCount > 0 && (
                <span className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium z-10">
                  {requestedConnectionsCount}
                </span>
              )}
            </div>
            </>
          )}

          <div className="flex items-center gap-4 relative">
            
            <NavActions />
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden px-8 pb-4 flex flex-col gap-4 text-sm font-medium bg-white border-b border-neutral-100 animate-fade-in-down">
          {/* <Link href="/about" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text" onClick={() => setMenuOpen(false)}>about</Link> */}
          {isSubscribed && (
            <>
              <Link href="/opportunities" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text" onClick={() => setMenuOpen(false)}>opportunities</Link>
              <Link href="/articles" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text" onClick={() => setMenuOpen(false)}>feed</Link>
              <Link href="/ats" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text" onClick={() => setMenuOpen(false)}>ats</Link>
              {/* <Link href="/feed" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">feed</Link> */}
              <div className="relative inline-block">
                <Link href="/people" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text" onClick={() => setMenuOpen(false)}>
                  people
                </Link>
                {requestedConnectionsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium z-10">
                    {requestedConnectionsCount}
                  </span>
                )}
              </div>
            </>
          )}
          <NavActions />
        </div>   
      )}
    </nav>
  );
}
