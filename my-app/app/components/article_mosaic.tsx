import { client } from "@/lib/sanity/client";
import { type SanityDocument } from "next-sanity";
import Link from "next/link";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { ArrowRight, Megaphone } from "lucide-react";
import Share from "@/app/components/share";
import { CombinedFeed } from "./combined-feed";
import RainbowBookmark from "@/app/components/rainbow_bookmark";
import { Alert, AlertDescription } from "@/components/ui/alert";
// --- Types --------------------------------------------------------------
export interface Post extends SanityDocument {
  title: string;
  slug: { current: string };
  publishedAt: string;
  image?: SanityImageSource;
  excerpt?: string;
  author?: string;
  // NOTE: tags are simple strings in Sanity schema
  tags?: string[];
}

export interface FeedItem {
  id: string;
  created_at: string;
  subscriber_id: number;
  company_id?: number;
  feed_id?: string;
  content: string; // HTML content
  audience_rating: number;
  // Additional fields for display
  author_name?: string;
  author_image?: string;
  company_name?: string;
  company_image?: string;
  // Repost data
  referenced_feed_content?: string;
  referenced_feed_author?: string;
  // Complete company data for CompanyRow
  company_data?: {
    _id: string;
    _rev: string;
    _type: string;
    _createdAt: string;
    _updatedAt: string;
    publishedAt: string;
    partner: boolean;
    company: number;
    alt: string;
    caption?: string;
    description?: string;
    imageUrl: string;
    location?: string;
    hiring_tags?: string[];
  };
}

export interface CombinedFeedItem {
  type: 'post' | 'thread';
  date: string;
  data: Post | FeedItem;
}

// --- Utils --------------------------------------------------------------
const builder = imageUrlBuilder(client);
function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}

// Normalize tags → role labels (title case)

// --- Query --------------------------------------------------------------
// Tags are simple strings in the Sanity schema
const POSTS_QUERY = `*[
  _type == "post" && defined(slug.current) && !(slug.current match "*-beta*")
]|order(publishedAt desc){
  _id, title, slug, publishedAt, image, excerpt, author, tags
}`;


// --- Feed Row (one per row) ---------------------------------------------
export function FeedRow({ post, index = 0 }: { post: Post; index?: number }) {

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
          <div className="flex w-full flex-col p-6 sm:p-8 md:w-[62%]">
            <h2 className="line-clamp-2 text-2xl md:text-3xl font-semibold leading-snug tracking-tight text-neutral-900 transition-colors duration-200 group-hover:text-neutral-700 dark:text-neutral-50 dark:group-hover:text-neutral-200 text-left">
              {post.title}
            </h2>

            {post.excerpt && (
              <p className="mt-3 line-clamp-3 text-base md:text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
                {post.excerpt}
              </p>
            )}

            <div className="mt-4 flex items-end gap-2">
                <RainbowBookmark company={index}/>
                <Share company={index} />
              </div>
            <div className="mt-6 inline-flex items-center gap-2 self-start text-base md:text-lg font-medium text-neutral-700 transition-colors duration-200 group-hover:text-neutral-900 dark:text-neutral-200 dark:group-hover:text-white">
              Read more <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}


// --- Newsfeed (one per row vibe) ----------------------------------------
export async function ArticleNewsfeed() {
  const posts = await client.fetch<Post[]>(POSTS_QUERY);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-8">
        {/* Welcome Header - Centered */}
        <div className="text-center pt-16 pb-8">
            <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-black">
                Your Curated and Verified Feed
            </h1>
        <p className="text-md md:text-md text-neutral-500 leading-relaxed font-light max-w-3xl mx-auto mb-8">
            Every week, The Niche publishes company profiles where we interview the founders and dive deep into how each sector operates, what teams are looking for, what the market looks right now in each industry, etc. 
        </p>
        <Alert className="max-w-3xl mx-auto mb-8 bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border border-yellow-200">
          <Megaphone className="h-5 w-5 text-orange-600" />
          <AlertDescription>
            <span className="text-neutral-700">
              We are now introducing <strong>Thought Threads</strong> where you can thread your opinion and any updates you have on our company profiles, customizing in your professional network who exactly gets to read your thread!
            </span>
          </AlertDescription>
        </Alert>
        </div>
        
        {/* Client-side combined feed */}
        <CombinedFeed posts={posts} />
      </div>

      {/* Browse all */}
      <div className="mt-10 text-center">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          Browse all articles
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
