import { client } from "@/lib/sanity/client";
import { type SanityDocument } from "next-sanity";
import Link from "next/link";
import Image from "next/image";
import imageUrlBuilder from '@sanity/image-url';
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { Container } from "./container";

export async function ArticleMosaic() {
    const POSTS_QUERY = `*[
        _type == "post"
        && defined(slug.current)
      ]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt, image, excerpt}`;

    const options = { next: { revalidate: 30 } };
    const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);
    const builder = imageUrlBuilder(client);

    function urlForImage(source: SanityImageSource) {
        return builder.image(source)
    }

    return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {posts.map((post, index) => {
            // Determine the size class based on position
            const sizeClass = index === 0 ? 
                'md:col-span-8 md:row-span-2' : // First item is large
                index === 1 || index === 2 ? 
                'md:col-span-4' : // Second and third items are medium
                'md:col-span-4'; // Rest are regular

            const imageHeight = index === 0 ? 'h-[500px]' : 'h-[280px]';

            return (
                <div 
                    key={post._id} 
                    className={`group cursor-pointer ${sizeClass}`}
                >
                    <Link href={`/articles/${post.slug.current}`} className="block h-full">
                        <div className={`relative ${imageHeight} rounded-2xl overflow-hidden bg-zinc-900/30`}>
                            {post.image ? (
                                <Image
                                    src={urlForImage(post.image).url()}
                                    alt={post.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-all duration-500"
                                />
                            ) : (
                                <div className="w-full h-full bg-neutral-200 group-hover:scale-105 transition-all duration-500" />
                            )}
                            {/* Gradient overlay that gets darker on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-500" />
                            
                            {/* Text content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <h3 className={`${index === 0 ? 'text-3xl' : 'text-xl'} font-medium text-white mb-3`}>
                                        {post.title}
                                    </h3>
                                    <div className="space-y-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <p className="text-white/75 text-sm">
                                            {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                        {index === 0 && post.excerpt && (
                                            <p className="text-white/90 line-clamp-3 text-sm leading-relaxed">{post.excerpt}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            );
        })}
    </div>
    );
}