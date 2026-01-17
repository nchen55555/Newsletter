import { client } from "@/lib/sanity/client";
import { type SanityDocument } from "next-sanity";
import Link from "next/link";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { ArrowRight } from "lucide-react";
import { CombinedFeed } from "./combined-feed";
import { FeedItem } from "@/app/types";
import { CACHE_OPTIONS } from "@/lib/sanity/queries";
import { Card } from "@/components/ui/card";
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
const buildPostsQuery = (limit: number) => `*[
  _type == "post" && defined(slug.current) && !(slug.current match "*-beta*")
]|order(publishedAt desc)[0...${limit}]{
  _id, title, slug, publishedAt, image, excerpt, author, tags
}`;


// --- Feed Row (card-based) ---------------------------------------------
export function FeedRow({ post, index = 0 }: { post: Post; index?: number }) {
  return (
    <Link href={`/articles/${post.slug.current}`} className="group block">
      <Card className="overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        {/* Image with Title Overlay - Full card size */}
        {post.image && (
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={urlForImage(post.image).width(800).height(450).fit("crop").auto("format").dpr(2).url()}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={index < 2}
            />
            {/* Dark overlay on hover */}
            <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/50" />

            {/* Title appears on hover */}
            <div className="absolute inset-x-0 bottom-0 p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <h2 className="text-left text-xl font-semibold leading-snug tracking-tight text-white">
                {post.title}
              </h2>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}


// --- Newsfeed (one per row vibe) ----------------------------------------
export async function ArticleNewsfeed({ limit = 20, cols = 2 }: { limit?: number, cols?: number } = {}) {
  const query = buildPostsQuery(limit);

  let posts: Post[] = [];
  try {
    posts = await client.fetch<Post[]>(query, {}, CACHE_OPTIONS.POSTS);
  } catch (error) {
    console.warn("⚠️ Failed to fetch posts for ArticleNewsfeed:", error);
    posts = [];
  }
  return (
    <div className="py-8 pt-2">
    <div className="animate-in fade-in-50 duration-700">
      {/* Network Breakdown Section */}
      <div className="mb-12 max-w-6xl mx-auto">
        {/* <h2 className="text-xl font-semibold mb-6 text-foreground">
          Company Profiles Published Weekly
        </h2> */}
        <CombinedFeed posts={posts} cols={cols}/>
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
      </div>
    </div>
  );
}
