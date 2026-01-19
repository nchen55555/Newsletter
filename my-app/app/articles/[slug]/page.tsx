import { client } from "@/lib/sanity/client";
import { type SanityDocument } from "next-sanity";
import ClientPostPage from './client_page';

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

const options = { next: { revalidate: 900 } }; // 15 minutes - articles change less frequently


export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await client.fetch<SanityDocument>(POST_QUERY, await params, options);
  return <ClientPostPage post={post} />;
  
}
