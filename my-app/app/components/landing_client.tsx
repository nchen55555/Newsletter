"use client";
import BlogTypingDemo from "./blog_typing_demo";
import { ArticleCards } from "./article_issues";
import type { ArticleCardPost } from "./article_issues";

export default function LandingClient({ posts }: { posts: ArticleCardPost[] }) {
  
  return (
    <div className="flex flex-1 flex-col md:flex-row w-full max-w-[1400px] px-8 mx-auto py-12 gap-12 md:items-start">
      <main className="flex-[2] flex items-center justify-center transition-all duration-700 md:mr-10">
        <div className="relative rounded-xl overflow-hidden w-full">
          <BlogTypingDemo />
        </div>
      </main>
      <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 opacity-80 scale-95 animate-fadeInRight md:ml-auto">
        <ArticleCards posts={posts} />
      </aside>
    </div>
  );
}
