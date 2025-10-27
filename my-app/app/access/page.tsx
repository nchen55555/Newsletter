'use server'
import { Navigation } from "../components/header";
import LandingClient from "../components/landing_client";
import { client } from "@/lib/sanity/client";
import { LIMITED_POSTS_QUERY, CACHE_OPTIONS } from "@/lib/sanity/queries";

export default async function Access() {
  const posts = await client.fetch(LIMITED_POSTS_QUERY, {}, CACHE_OPTIONS.POSTS);

  // Static mediaLibrary data for company cards (same as main page)
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
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
      <Navigation />
      <LandingClient posts={posts} mediaLibrary={mediaLibrary} />
    </div>
  );
}