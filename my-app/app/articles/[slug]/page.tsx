import { PortableText, type PortableTextComponents } from '@portabletext/react'
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";
import Link from "next/link";
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import Image from "next/image";
import { ProtectedContent } from "@/app/components/protected-content";
import { type SanityDocument } from "next-sanity";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

const components: PortableTextComponents = {
  types: {},
  marks: {},
  block: {
    h1: ({ children }) => <h1 className="text-4xl font-bold">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-semibold">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-medium">{children}</h3>,
    normal: ({ children }) => <p className="text-base">{children}</p>,
  },
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await client.fetch<SanityDocument>(POST_QUERY, await params, options);
  return (
    <ProtectedContent>
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <Container>
        <div className="pt-12 pb-16 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
        <Link href="/articles" className="text-sm hover:opacity-70 transition-opacity">
          ← back to the nic(h)e list
        </Link>
        <div className="mt-8">
          <div className="flex gap-16">
            {post.image && (
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shrink-0" style={{ width: '650px' }}>
                <Image
                  src={urlFor(post.image)?.url() || ''}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 650px"
                  priority
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-medium tracking-tight mb-4">{post.title}</h1>
              <p className="text-sm text-neutral-500 mb-8">
                Published: {new Date(post.publishedAt).toLocaleDateString()}
              </p>
              <div className="prose prose-neutral">
                {Array.isArray(post.body) && <PortableText value={post.body} components={components} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
    </div>
    </ProtectedContent>
  );
}