import { PortableText, type PortableTextComponents, type PortableTextBlock } from '@portabletext/react'
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";
// import Link from "next/link";
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import Image from "next/image";
// import { ProtectedContent } from '@/app/components/protected-content';
import { type SanityDocument } from "next-sanity";
import RainbowBookmark from "@/app/components/rainbow_bookmark";
import ApplyButton from "@/app/components/apply";
import { TableOfContents } from "@/app/components/table-of-contents";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

const createComponents = (content: PortableTextBlock[]): PortableTextComponents => ({
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
    h1: ({ children, value }) => {
      const index = content.findIndex(block => block === value);
      const id = `heading-${index}`;
      return <h1 id={id} className="text-4xl font-medium mb-6 scroll-mt-24">{children}</h1>;
    },
    h2: ({ children, value }) => {
      const index = content.findIndex(block => block === value);
      const id = `heading-${index}`;
      return <h2 id={id} className="text-3xl font-medium mb-5 scroll-mt-24">{children}</h2>;
    },
    h3: ({ children, value }) => {
      const index = content.findIndex(block => block === value);
      const id = `heading-${index}`;
      return <h3 id={id} className="text-2xl font-normal mb-4 scroll-mt-24">{children}</h3>;
    },
    normal: ({ children }) => <p className="text-base mb-4 leading-relaxed">{children}</p>,
  },
});


export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await client.fetch<SanityDocument>(POST_QUERY, await params, options);
  const components = createComponents(post.body || []);
  
  return (
    // <ProtectedContent>
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <Container>
        <div className="pt-12 pb-16">
          {/* Main Layout with Sidebar */}
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Table of Contents Sidebar */}
              <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
                {/* Action Buttons - Always visible */}
                <div className="sticky top-6 mb-6">
                  <div className="flex flex-row gap-3 mb-6">
                    <RainbowBookmark company={post.company} />
                    <ApplyButton company={post.company} />
                  </div>
                  
                  {/* Table of Contents */}
                  {Array.isArray(post.body) && post.body.length > 0 && (
                    <TableOfContents content={post.body} />
                  )}
                </div>
              </aside>
              
              {/* Main Article Content */}
              <main className="flex-1 order-1 lg:order-2 min-w-0">
                <div className="px-4 lg:px-8">
                  {/* Header Section - aligned with main content */}
                  <div className="mb-12">
                    {post.image && (
                      <div className="relative w-full mb-8">
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
                    <div className="text-center lg:text-left">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight mb-4">{post.title}</h1>
                      <div className="flex flex-row gap-3 mb-4 items-center justify-center lg:justify-start">
                        <RainbowBookmark company={post.company} />
                        <ApplyButton company={post.company} />
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-500 mb-8">
                        Published: {new Date(post.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Article Body */}
                  <div className="prose prose-neutral prose-lg max-w-none">
                    {Array.isArray(post.body) && <PortableText value={post.body} components={components} />}
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </Container>
    </div>
    // </ProtectedContent>
  );
}