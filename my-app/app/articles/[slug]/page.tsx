import { PortableText, type PortableTextComponents } from '@portabletext/react'
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";
// import Link from "next/link";
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import Image from "next/image";
// import { ProtectedContent } from "@/app/components/protected-content";
import { type SanityDocument } from "next-sanity";
import RainbowBookmark from "@/app/components/rainbow_bookmark";
import ApplyButton from "@/app/components/apply";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      const imageUrl = urlFor(value)?.width(1200).url();
      if (!imageUrl) return null;
  
      return (
        <div className="w-full my-8">
          <Image
            src={imageUrl}
            alt={value.alt || 'Post image'}
            width={1200}
            height={700}
            className="rounded-xl object-contain w-full h-auto"
          />
          {value.caption && (
            <p className="mt-2 text-sm text-center text-neutral-500 italic">
              {value.caption}
            </p>
          )}
        </div>
      );
    },
  },  
  marks: {},
  block: {
    h1: ({ children }) => <h1 className="text-4xl font-bold mb-6">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-semibold mb-5">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-medium mb-4">{children}</h3>,
    normal: ({ children }) => <p className="text-base mb-4">{children}</p>,
  },
};


export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await client.fetch<SanityDocument>(POST_QUERY, await params, options);
  return (
    // <ProtectedContent>
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <Container>
        <div className="pt-12 pb-16 relative">
          
        <div className="mt-8">
          <div>
            {post.image && (
              <div className="relative w-full mb-12">
                <Image
                  src={urlFor(post.image)?.url() || ''}
                  alt={post.title}
                  width={post.image.asset?.metadata?.dimensions?.width || 800}
                  height={post.image.asset?.metadata?.dimensions?.height || 600}
                  className="rounded-2xl object-contain w-full h-auto"
                  sizes="(max-width: 1024px) 100vw, 650px"
                  priority
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight mb-4 text-center lg:text-left">{post.title}</h1>
              <div className="flex flex-row gap-3 mb-4 items-center justify-center lg:justify-start">
                <RainbowBookmark  company={post.company} />
                <ApplyButton company={post.company} />
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 mb-6 lg:mb-8 text-center lg:text-left">
                Published: {new Date(post.publishedAt).toLocaleDateString()}
              </p>
              <div className="prose prose-neutral max-w-full [&>*]:clear-both">
                {Array.isArray(post.body) && <PortableText value={post.body} components={components} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
    </div>
    // </ProtectedContent>
  );
}