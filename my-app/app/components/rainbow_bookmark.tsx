'use client'
import React from "react";
import { useState, useEffect } from "react";
import { useSubscriptionContext } from "./subscription_context";

export default function RainbowBookmark({ company }: { company: number }) {
  const { isSubscribed } = useSubscriptionContext();
  const [bookmarked, setBookmarked] = useState(false);

  // On mount, fetch bookmarks and set initial state
  useEffect(() => {
    let isMounted = true;
    async function fetchBookmarks() {
      try {
        const res = await fetch("/api/get_bookmarks", { credentials: "include" });
        if (!res.ok) return;
        const { bookmarks } = await res.json();
        if (isMounted) {
          setBookmarked(Array.isArray(bookmarks) && bookmarks.includes(company));
        }
      } catch (e) {
        console.log("Failed to fetch bookmarks:", e)
      }
    }
    fetchBookmarks();
    return () => { isMounted = false; };
  }, [company]);
  const [loading, setLoading] = useState(false);

  if (!isSubscribed) return null;

  const handleBookmark = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, action: bookmarked ? 'remove' : 'add' }),
      });
      if (res.ok) {
        setBookmarked((b) => !b);
      } else {
        // handle error
        alert("Failed to bookmark");
      }
    } catch {
      alert("Error bookmarking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center lg:justify-start mb-2">
      <button
        aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
        onClick={handleBookmark}
        className="group p-1 rounded transition bg-black hover:bg-black/90 text-white"
        style={{ outline: "none", border: "none", background: "none" }}
        type="button"
        disabled={loading}
      >
        <svg
          width={32}
          height={32}
          viewBox="0 0 24 24"
          fill={bookmarked ? "#000" : "none"}
          stroke="#000"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`drop-shadow-sm transition-all duration-300 ${loading ? "opacity-50" : ""}`}
        >
          <path
            d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
            fill={bookmarked ? "#000" : "none"}
            stroke="#000"
          />
        </svg>
      </button>
    </div>
  );
}