'use client'
import { client } from "@/lib/sanity/client";
import { type SanityDocument } from "next-sanity";
import Link from "next/link";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { ArrowRight, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// --- Types --------------------------------------------------------------
export interface Post extends SanityDocument {
  title: string;
  slug: { current: string };
  publishedAt: string;
  image?: SanityImageSource;
  excerpt?: string;
  author?: string;
  // NOTE: allow multiple shapes since Sanity "tags" can be strings or objects
  tags?: Array<
    | string
    | { title?: string; name?: string }
    | { tag?: string }
    | { _type?: string; _ref?: string; title?: string; name?: string }
  >;
}

// --- Utils --------------------------------------------------------------
const builder = imageUrlBuilder(client);
function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}

// Normalize tags → role labels (title case)
function getRoleLabels(tags?: Post["tags"]) {
  if (!tags || !Array.isArray(tags)) return [];
  const raw = tags
    .map((t) => {
      if (typeof t === "string") return t;
      if (t && typeof t === "object") {
        // common shapes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyT = t as any;
        return anyT.title ?? anyT.name ?? anyT.tag ?? "";
      }
      return "";
    })
    .filter(Boolean) as string[];

  // de-dup and title-case
  const seen = new Set<string>();
  return raw
    .map((s) =>
      s
        .toString()
        .trim()
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ")
        .toLowerCase()
    )
    .filter((s) => {
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    })
    .map((s) =>
      s.replace(/\b\w/g, (c) => c.toUpperCase()) // Title Case
    );
}

// --- Query --------------------------------------------------------------
// If your schema uses a different field than "tags", adjust accordingly.
// If tags are references, you can project their titles like:
// tags[]-> { title }
const POSTS_QUERY = `*[
  _type == "post" && defined(slug.current) && !(slug.current match "*-beta*")
]|order(publishedAt desc){
  _id, title, slug, publishedAt, image, excerpt, author, tags
}`;

// --- Feed Row (one per row) ---------------------------------------------
export function FeedRow({ post, index = 0 }: { post: Post; index?: number }) {
  const roles = getRoleLabels(post.tags);

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
      <Link
        href={`/articles/${post.slug.current}`}
        className="block focus:outline-none"
        aria-label={post.title}
      >
        <div className="flex flex-col gap-0 md:flex-row">
          {/* Media (left on md+) */}
          <div className="relative w-full md:w-[38%]">
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none">
              {post.image ? (
                <Image
                  src={urlForImage(post.image).width(1200).height(750).fit("crop").auto("format").dpr(2).url()}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 38vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority={index < 2}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700">
                  <span className="text-6xl text-neutral-400">📰</span>
                </div>
              )}
            </div>
          </div>

          {/* Content (right on md+) */}
          <div className="flex w-full flex-col p-5 sm:p-6 md:w-[62%]">
            <h2 className="line-clamp-2 text-xl font-semibold leading-snug tracking-tight text-neutral-900 transition-colors duration-200 group-hover:text-neutral-700 dark:text-neutral-50 dark:group-hover:text-neutral-200 text-left">
              {post.title}
            </h2>

            {post.excerpt && (
              <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                {post.excerpt}
              </p>
            )}

            {/* Roles from tags */}
            {roles.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 inline-flex items-center gap-1 self-start text-sm font-medium text-neutral-700 transition-colors duration-200 group-hover:text-neutral-900 dark:text-neutral-200 dark:group-hover:text-white">
              Read more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

// --- Newsfeed (one per row vibe) ----------------------------------------
export function ArticleNewsfeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [verifiedToTheNiche, setVerifiedToTheNiche] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch posts
        const options = { next: { revalidate: 30 } } as const;
        const fetchedPosts = await client.fetch<Post[]>(POSTS_QUERY, {}, options);
        setPosts(fetchedPosts);

        // Fetch profile to check applied status
        const profileRes = await fetch(`/api/get_profile`, {
          credentials: 'include'
        });
        
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setVerifiedToTheNiche(profile.verified || false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } 
    };

    fetchData();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-8">
                    {/* Welcome Header */}
        <div className="text-center pt-16 pb-8">
            <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-black">
                The Latest Feed
            </h1>
        <p className="text-lg md:text-xl text-neutral-500 leading-relaxed font-light max-w-3xl mx-auto mb-8">
            Every week, The Niche publishes two to three company profiles on opportunities within our partner circle for you to stay tuned. We interview the founders directly and dive deep into how each sector operates, what teams are looking for, what the market looks right now in each industry, etc. 
        </p>
        </div>
      {/* Feed: one post per row */}
      {verifiedToTheNiche && (
        <div className="flex flex-col gap-6 sm:gap-7">
          {posts.map((post, index) => (
            <FeedRow key={post._id} post={post} index={index} />
          ))}
        </div>
      )}
      {!verifiedToTheNiche && (
        <Alert className="max-w-2xl mx-auto">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Create Your Profile and Wait for It To Get Verified To Access
          </AlertDescription>
        </Alert>
      )}

      {/* Empty state */}
      {verifiedToTheNiche && posts.length === 0 && (
        <div className="mx-auto my-24 max-w-xl rounded-3xl border border-dashed p-10 text-center text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
          <p className="text-lg">No posts yet. Check back soon for fresh stories.</p>
        </div>
      )}

      {/* Browse all */}
      {verifiedToTheNiche && (
        <div className="mt-10 text-center">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            Browse all articles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
    </div>
  );
}
