import { PortableText, type PortableTextComponents, type PortableTextBlock } from '@portabletext/react'
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import Image from "next/image";
import { type SanityDocument } from "next-sanity";
import RainbowBookmark from "@/app/components/rainbow_bookmark";
import ApplyButton from "@/app/components/apply";
import { TableOfContents } from "@/app/components/table-of-contents";
import { Card } from "@/components/ui/card";


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
  const tags = Array.isArray(post.tags) ? post.tags : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <Container>
        <div className="pt-12 pb-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
                <div className="sticky top-6 mb-6">
                  <div className="flex flex-row gap-3 mb-6">
                    <RainbowBookmark company={post.company} />
                    <ApplyButton company={post.company} />
                  </div>
                  {Array.isArray(post.body) && post.body.length > 0 && (
                    <TableOfContents content={post.body} />
                  )}
                </div>
              </aside>

              {/* Main */}
              <main className="flex-1 order-1 lg:order-2 min-w-0">
                <div className="px-4 lg:px-8">
                  {/* Header + Hero Image */}
                  <div className="mb-12">
                    {post.image && (
                      <div className="relative w-full mb-8">
                        <Image
                          src={urlFor(post.image)?.url() || ''}
                          alt={post.title || 'Post image'}
                          width={post.image.asset?.metadata?.dimensions?.width || 800}
                          height={post.image.asset?.metadata?.dimensions?.height || 600}
                          className="rounded-2xl object-contain w-full h-auto"
                          sizes="(max-width: 1024px) 100vw, 650px"
                          priority
                        />
                      </div>
                    )}

                    <div className="text-center lg:text-left">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight mb-4">
                        {post.title}
                      </h1>
                      <div className="flex flex-row gap-3 mb-4 items-center justify-center lg:justify-start">
                        <RainbowBookmark company={post.company} />
                        {/* <ApplyButton company={post.company} /> */}
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-500 mb-8">
                        Published: {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                   {/* NEW: Role Cards from post.tags */}
                  {tags.length > 0 && (
                    <div className="mb-12">
                      <h3 className="text-xl font-semibold mb-6 text-neutral-800">Roles Partnered with The Niche</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tags.map((tag) => (
                          <Card
                            key={tag}
                            className="rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white border border-neutral-200 p-6"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-lg font-medium text-neutral-900">{tag}</span>
                              <div className="flex-shrink-0">
                                <ApplyButton company={post.company} />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Body */}
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
  );
}
