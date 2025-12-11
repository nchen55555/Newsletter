"use client";

import Link from "next/link";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";
import type { ArticleCardPost } from "./article_issues";

const builder = imageUrlBuilder(client);
function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}

export function ArticleLandingPage({ posts }: { posts: ArticleCardPost[] }) {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
      {posts.map((post) => (
        <div key={post._id} className="mb-6 break-inside-avoid">
          <Link href={`/articles/${post.slug.current}`} className="block h-full group">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden relative shadow-xl border border-white/20">
              {post.image ? (
                <Image
                  src={urlForImage(post.image).url()}
                  alt={post.title}
                  width={600}
                  height={450}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                  <span className="text-neutral-500 text-lg font-medium">
                    Article {post._id.slice(-3)}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-500" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <p className="text-sm text-white/60 mb-3">
                  issue #{post._id.slice(-3)} —{" "}
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <h3 className="text-xl font-semibold text-white mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  {post.title}
                </h3>
                <p className="text-white/90 text-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}


