'use client'
import { useState, useEffect } from "react";

export default function RainbowBookmark({ slug }: { slug: string }) {
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
          setBookmarked(Array.isArray(bookmarks) && bookmarks.includes(slug));
        }
      } catch (e) {
        // fail silently, default to not bookmarked
      }
    }
    fetchBookmarks();
    return () => { isMounted = false; };
  }, [slug]);
  const [loading, setLoading] = useState(false);

  const handleBookmark = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: bookmarked ? 'remove' : 'add' }),
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
        className="group p-1 rounded transition"
        style={{ outline: "none", border: "none", background: "none" }}
        type="button"
        disabled={loading}
      >
        <svg
          width={32}
          height={32}
          viewBox="0 0 24 24"
          fill={bookmarked ? "url(#rainbow-gradient)" : "none"}
          stroke="url(#rainbow-gradient)"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`drop-shadow-sm transition-all duration-300 ${loading ? "opacity-50" : ""}`}
        >
          <defs>
            <linearGradient id="rainbow-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ec4899" />
              <stop offset="0.25" stopColor="#fbbf24" />
              <stop offset="0.5" stopColor="#34d399" />
              <stop offset="0.75" stopColor="#60a5fa" />
              <stop offset="1" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <path
            d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
            fill={bookmarked ? "url(#rainbow-gradient)" : "none"}
            stroke="url(#rainbow-gradient)"
          />
        </svg>
      </button>
    </div>
  );
}