'use server'
import { Navigation } from "./components/header";
import LandingClient from "./components/landing_client";
import { client } from "@/lib/sanity/client";

export default async function Home() {
  // Fetch posts from Sanity but use static mediaLibrary for companies 6 & 7
  const POSTS_QUERY = `*[_type == "post" 
  && defined(slug.current)
  && !(slug.current match "*-beta*")
  ]|order(publishedAt desc)[0...6]{_id, title, slug, publishedAt, image}`;
  
  const options = { next: { revalidate: 300 } };
  
  let posts = [];
  
  try {
    posts = await client.fetch(POSTS_QUERY, {}, options);
    console.log('✅ Fetched posts from Sanity:', posts.length, 'items');
  } catch (error) {
    console.warn('⚠️ Sanity API quota exceeded - using empty posts', error);
    posts = [];
  }

  // Static mediaLibrary data for company cards (avoids Sanity API calls)
  const mediaLibrary = [
    { 
      _id: '1', 
      image: "https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/avatar_profiles/unify.webp", 
      alt: 'Unify Logo', 
      company: '6'
    },
    { 
      _id: '2', 
      image: "https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/avatar_profiles/moment.webp", 
      alt: 'Moment Logo', 
      company: '7'
    }
  ];

  
  return (
    <div className="min-h-screen flex flex-col" style={{
      background: `
        radial-gradient(ellipse 700px 500px at 85% 15%, rgba(34, 197, 94, 0.3) 0%, rgba(124, 211, 87, 0.25) 15%, rgba(253, 224, 71, 0.3) 35%, rgba(253, 224, 71, 0.2) 60%, rgba(255, 255, 255, 0.8) 80%, rgba(255, 255, 255, 1) 100%),
        white
      `
    }}>
      <Navigation />
      <LandingClient posts={posts} mediaLibrary={mediaLibrary} />
    </div>
  );
}
