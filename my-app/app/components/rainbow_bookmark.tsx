'use client'
import React from "react";
import { useState, useEffect } from "react";
import { useSubscriptionContext } from "./subscription_context";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <Button
      variant={bookmarked ? "default" : "outline"}
      size="icon"
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      onClick={handleBookmark}
      disabled={loading}
      className={`transition-all duration-300 ${loading ? "opacity-50" : ""}`}
    >
      <Bookmark 
        className={`h-4 w-4 transition-all duration-300 ${bookmarked ? "fill-current" : ""}`}
      />
    </Button>
  );
}