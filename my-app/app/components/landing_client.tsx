"use client";
import Link from "next/link";
import Image from "next/image";
import imageUrlBuilder from '@sanity/image-url';
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ArticleCardPost } from "./article_issues";
import {Subscribe} from "@/app/components/subscribe";
import { useSubscriptionContext } from './subscription_context';
import FrontCompanyProfile from './frontcompanyprofile';
import FrontProfile from './frontprofile';


interface MediaLibraryItem {
  _id: string;
  image: string;
  alt: string;
  company: string;
}

export default function LandingClient({ posts, mediaLibrary }: { posts: ArticleCardPost[], mediaLibrary: MediaLibraryItem[] }) {
  const builder = imageUrlBuilder(client);
  const router = useRouter();
  const { isSubscribed, loading } = useSubscriptionContext();

  // Log media library data for debugging
  useEffect(() => {
    console.log('Media library received:', mediaLibrary.length, 'items');
    console.log('Media library data:', mediaLibrary);
  }, [mediaLibrary]);

  function urlForImage(source: SanityImageSource) {
    return builder.image(source);
  }

  // Check demo status and route to tour if needed
  useEffect(() => {
    const checkDemoStatus = async () => {
      if (!loading && isSubscribed) {
        try {
          const response = await fetch('/api/check_demo_status');
          if (response.ok) {
            const data = await response.json();
            if (!data.applied){
              router.push('/profile')
            }
            if (!data.demo_done && data.verified) {
              router.push('/tour');
            }
          }
        } catch (error) {
          console.error('Error checking demo status:', error);
        }
      }
    };

    checkDemoStatus();
  }, [isSubscribed, loading, router]);
  
  return (
    <div>
      {/* Hero section - Desktop */}
      <div className="hidden lg:flex min-h-[100dvh] items-center justify-center relative">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 relative z-10">
          {/* Company profiles - mobile: above text, desktop: left side */}
          <div className="w-full lg:flex-1 max-w-md relative flex justify-center transform translate-x-0 lg:translate-x-8 -translate-y-8 lg:-translate-y-16">
            {/* Profile components above the company cards */}

            {/* Profiles above company cards */}
            <div className="hidden lg:block absolute -top-24 -left-8 lg:-top-36 lg:-left-16 transform -translate-x-4 lg:-translate-x-8">
              <FrontProfile 
                profileImage="https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/avatar_profiles/wellington-ferreira-72TE8cWKXRY-unsplash.jpg"
                name="Nicole"
                messageType="intro"
              />
            </div>
            
            <div className="hidden lg:block absolute -top-12 right-12 lg:-top-56 lg:right-28 transform translate-x-4 lg:translate-x-8">
              <FrontProfile 
                profileImage="https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/avatar_profiles/aiony-haust-3TLl_97HNJo-unsplash.jpg"
                name="Amber"
                messageType="recommendation"
              />
            </div>
            
            {/* Profile below company cards */}
            {/* Unify card */}
            <div className="transform -translate-x-16 lg:-translate-x-62">
              <FrontCompanyProfile 
                mediaLibrary={mediaLibrary} 
                companyId="6"
                companyName="unify"
                description="ex-Scale and cto Connor Heggie partners with The Niche to pioneer Unify's first new-grad and intern class"
              />
            </div>
            
            {/* Moment card - overlapping bottom right */}
            <div className="absolute bottom-0 right-1/2 transform translate-x-4 lg:translate-x-16 translate-y-12 lg:translate-y-24">
              <FrontCompanyProfile 
                mediaLibrary={mediaLibrary} 
                companyId="7"
                companyName="moment"
                description="ex-Citadel quant trader and founder Dylan Parker partners with The Niche to connect and intro with the best technical talent"
              />
            </div>
            <div className="hidden lg:block absolute bottom-0 left-20 lg:bottom-0 lg:left-10 transform translate-y-24 lg:translate-y-56">
              <FrontProfile 
                profileImage="https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/avatar_profiles/nicolas-horn-MTZTGvDsHFY-unsplash.jpg"
                name="Dylan"
                messageType="thoughts"
              />
            </div>
            
          </div>
          
          {/* Text content - mobile: below cards, desktop: right side */}
          <div className="w-full lg:flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Private Beta badge */}
            {/* <div className="text-sm font-medium text-black/70 tracking-wide">
              Private Beta
            </div> */}
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-tight">
              Discover Your<br />
              Niche of<br />
              Opportunities
            </h1>
            
            <p className="text-lg text-black/80 max-w-2xl leading-relaxed">
              Introductions to opportunities and founders at some of the highest talent density startups. Curate your personalized, professional network and get warm intros to opportunities referred by your peers and verified by your skills and interests. Access restricted to personal referral only.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-start items-start mt-8">
              <Subscribe />
            </div>
          </motion.div>
          </div>
        </div>
      </div>

      {/* Hero section - Mobile/Tablet */}
      <div className="lg:hidden min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black leading-tight">
              Discover Your<br />
              Niche of<br />
              Opportunities
            </h1>
            
            <p className="text-lg text-black/80 leading-relaxed">
              Introductions to opportunities and founders at some of the highest talent density startups. Curate your personalized, professional network and get warm intros to opportunities referred by your peers and verified by your skills and interests. Access restricted to personal referral only.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <Subscribe />
            </div>
          </motion.div>
        </div>
      </div>

      
    </div>
  );
}