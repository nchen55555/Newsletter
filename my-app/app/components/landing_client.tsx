"use client";
import { useState } from "react";
import BlogTypingDemo from "./blog_typing_demo";
import { ArticleCards } from "./article_issues";

import type { ArticleCardPost } from "./article_issues";

export default function LandingClient({ posts }: { posts: ArticleCardPost[] }) {
  const [showArticles, setShowArticles] = useState(false);

  return (
    <div className="flex flex-1 flex-col md:flex-row w-full max-w-[1400px] px-8 mx-auto py-12 gap-12 md:items-start">
      <main className={`flex-[2] flex items-center justify-center transition-all duration-700 ${showArticles ? 'md:mr-10' : ''}`}>
        <div className="relative rounded-xl overflow-hidden w-full">
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-r from-pink-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 blur-sm" />
          <BlogTypingDemo onTypingDone={() => setShowArticles(true)} />
        </div>
      </main>
      {showArticles && (
        <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 opacity-80 scale-95 animate-fadeInRight md:ml-auto">
          <ArticleCards posts={posts} />
        </aside>
      )}
    </div>
  );
}
