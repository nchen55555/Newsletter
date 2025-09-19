import { PortableText, type PortableTextComponents, type PortableTextBlock } from '@portabletext/react'
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import Image from "next/image";
import { type SanityDocument } from "next-sanity";
import ApplyButton from "@/app/components/apply";
import { TableOfContents } from "@/app/components/table-of-contents";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

// Type for Sanity tag objects
type SanityTag = string | {
  title?: string;
  name?: string;
  tag?: string;
};

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

// Normalize possible tag shapes → clean role labels
function getRoleLabels(rawTags: unknown): string[] {
  const arr = Array.isArray(rawTags) ? rawTags : [];
  const names = arr
    .map((t: SanityTag) => {
      if (typeof t === "string") return t;
      return t?.title ?? t?.name ?? t?.tag ?? "";
    })
    .filter(Boolean) as string[];

  // de-dup and properly title-case the string tags
  const seen = new Set<string>();
  return names
    .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    .map((tag) => {
      // Clean up the tag but preserve original capitalization where appropriate
      const cleaned = tag
        .trim()
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ");
      
      // Convert to proper title case, preserving abbreviations
      return cleaned.replace(/\w\S*/g, (word) => {
        // If word is already all uppercase (likely an abbreviation), keep it
        if (word.length > 1 && word === word.toUpperCase()) {
          return word;
        }
        // Otherwise, standard title case
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
    })
    .filter((tag) => {
      const normalized = tag.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await client.fetch<SanityDocument>(POST_QUERY, await params, options);
  const components = createComponents(post.body || []);
  const roles = getRoleLabels(post.tags);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Container>
        <div className="pt-10 pb-16">
          <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar (clean + sticky) */}
              <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
                <div className="sticky top-6 space-y-4">
                  {Array.isArray(post.body) && post.body.length > 0 && (
                    <TableOfContents content={post.body} />
                  )}
                </div>
              </aside>

              {/* Main */}
              <main className="flex-1 order-1 lg:order-2 min-w-0">
                {/* Title + Hero */}
                <header className="mb-8">
                  {post.image && (
                    <div className="relative w-full mb-6">
                      <Image
                        src={urlFor(post.image)?.url() || ''}
                        alt={post.title || 'Post image'}
                        width={post.image.asset?.metadata?.dimensions?.width || 1200}
                        height={post.image.asset?.metadata?.dimensions?.height || 700}
                        className="rounded-lg object-cover w-full h-auto"
                        sizes="(max-width: 768px) 100vw, 100vw"
                        priority
                      />
                    </div>
                  )}
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight">
                    {post.title}
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-neutral-500">
                    Published: {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                  </p>
                </header>

                {/* Company profile/body */}
                <section className="prose prose-neutral max-w-none">
                  {Array.isArray(post.body) && (
                    <PortableText value={post.body} components={components} />
                  )}
                </section>

                {/* Open roles — minimalist rows at bottom */}
                {roles.length > 0 && (
                  <section className="mt-10">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-3">
                      Open roles
                    </h2>
                    <ul className="divide-y divide-neutral-200">
                      {roles.map((role) => (
                        <li key={role} className="flex items-center justify-between py-3">
                          <span className="text-[15px] text-neutral-800">
                            {role}
                          </span>
                          <ApplyButton company={post.company} />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </main>
            </div>
        </div>
      </Container>
    </div>
  );
}
