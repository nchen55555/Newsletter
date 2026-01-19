import { TableOfContents } from "@/app/components/table-of-contents";
import { PortableText, PortableTextBlock, SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";
import Image from "next/image";
import { PortableTextComponents } from "@portabletext/react";

export default function PostContent({ post }: { post: SanityDocument }) {

    const { projectId, dataset } = client.config();
    const urlFor = (source: SanityImageSource) =>
    projectId && dataset
        ? imageUrlBuilder({ projectId, dataset }).image(source)
        : null;

        // Minimal, content-first PortableText renderers
    const createComponents = (content: PortableTextBlock[]): PortableTextComponents => ({
        types: {
        image: ({ value }) => {
            const imageUrl = urlFor(value)?.width(1200).url();
            if (!imageUrl) return null;
            return (
            <figure className="my-6">
                <Image
                src={imageUrl}
                alt={value.alt || 'Post image'}
                width={1200}
                height={700}
                className="rounded-lg object-contain w-full h-auto"
                />
                {value.caption && (
                <figcaption className="mt-2 text-sm text-neutral-500 italic text-center">
                    {value.caption}
                </figcaption>
                )}
            </figure>
            );
        },
        },
        marks: {},
        block: {
        h1: ({ children, value }) => {
            const index = content.findIndex(block => block === value);
            const id = `heading-${index}`;
            return <h1 id={id} className="text-3xl sm:text-4xl font-medium mb-4 scroll-mt-24">{children}</h1>;
        },
        h2: ({ children, value }) => {
            const index = content.findIndex(block => block === value);
            const id = `heading-${index}`;
            return <h2 id={id} className="text-2xl sm:text-3xl font-medium mb-3 scroll-mt-24">{children}</h2>;
        },
        h3: ({ children, value }) => {
            const index = content.findIndex(block => block === value);
            const id = `heading-${index}`;
            return <h3 id={id} className="text-xl sm:text-2xl font-semibold mb-3 scroll-mt-24">{children}</h3>;
        },
        normal: ({ children }) => <p className="text-[15px] leading-relaxed mb-3">{children}</p>,
        },
    });

    const components = createComponents(post.body || []);


  return (
    <div>
        <main>
          {/* Title + Hero */}
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight">
              {post.title}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-neutral-500">
              Published: {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
            </p>

            {/* Table of Contents */}
            {Array.isArray(post.body) && post.body.length > 0 && (
              <div className="mt-6">
                <TableOfContents content={post.body} />
              </div>
            )}
          </header>

          {/* Company profile/body */}
          {/* <PaywallContent wordLimit={300}> */}
            <section className="prose prose-neutral max-w-none">
              {Array.isArray(post.body) && (
                <PortableText value={post.body} components={components} />
              )}
            </section>
        
        </main>
      </div>
  )
}