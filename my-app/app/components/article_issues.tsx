'use client';
import Link from "next/link";
import Image from "next/image";
import imageUrlBuilder from '@sanity/image-url';
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";

export interface ArticleCardPost {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  image?: SanityImageSource;
}

export function ArticleCards({ posts, compact = false }: { posts: ArticleCardPost[], compact?: boolean }) {
    const builder = imageUrlBuilder(client);

    function urlForImage(source: SanityImageSource) {
        return builder.image(source)
    }

    return (
    <div className={compact ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" : "flex flex-col gap-8"}>
        {posts.map((post) => (
        <div
          className={compact ? "group cursor-pointer relative" : "group cursor-pointer relative"}
          key={post._id}
        >
            <Link href={`/articles/${post.slug.current}`} className="block h-full">
                <div className={compact ? "aspect-[4/3] rounded-xl overflow-hidden relative" : "aspect-[4/3] rounded-2xl overflow-hidden relative"}>
                    {post.image ? (
                        <Image
                            src={urlForImage(post.image).url()}
                            alt={post.title}
                            width={compact ? 340 : 600}
                            height={compact ? 255 : 450}
                            className={compact ? "w-full h-full object-cover group-hover:scale-105 transition-all duration-500" : "w-full h-full object-cover group-hover:scale-105 transition-all duration-500"}
                        />
                    ) : (
                        <div className="w-full h-full bg-neutral-200 group-hover:scale-105 transition-all duration-500" />
                    )}
                    {/* Gradient overlay that gets darker on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-500" />
                    {/* Text content */}
                    <div className={compact ? "absolute inset-0 p-3 flex flex-col justify-end" : "absolute inset-0 p-6 flex flex-col justify-end"}>
                        <p className={compact ? "text-xs text-white/60 mb-2" : "text-sm text-white/60 mb-3"}>issue #{post._id.slice(-3)} — {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <h3 className={compact ? "text-base font-medium text-white mb-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500" : "text-xl font-medium text-white mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500"}>{post.title}</h3>
                        <p className={compact ? "text-white/75 text-xs transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500" : "text-white/75 text-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500"}>
                            {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>
            </Link>
        </div>
     ))}
    </div>
  )
};