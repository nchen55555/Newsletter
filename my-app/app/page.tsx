'use server'
import { Navigation } from "./components/header";
import LandingClient from "./components/landing_client";
import { client } from "@/lib/sanity/client";

export default async function Home() {
  const POSTS_QUERY = `*[_type == "post" 
  && defined(slug.current)
  && !(slug.current match "*-beta*")
  ]|order(publishedAt desc){_id, title, slug, publishedAt, image}`;
  
  
  const options = { next: { revalidate: 30 } };
  const posts = await client.fetch(POSTS_QUERY, {}, options);

  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
      <Navigation />
      <LandingClient posts={posts} />
    </div>
  );
}
