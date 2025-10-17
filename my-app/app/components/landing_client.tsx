"use client";
import Link from "next/link";
import Image from "next/image";
import imageUrlBuilder from '@sanity/image-url';
import type { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ArticleCardPost } from "./article_issues";
import {Subscribe} from "@/app/components/subscribe";
import { useSubscriptionContext } from './subscription_context';

// Vertical Article Carousel Component
function VerticalArticleCarousel({ posts, urlForImage }: { 
  posts: ArticleCardPost[], 
  urlForImage: (source: SanityImageSource) => ImageUrlBuilder 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Auto-scroll functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
   
    if (posts.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % posts.length);
      }, 4000); // Change slide every 4 seconds
    }
   
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [posts.length]);

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600">No articles available at the moment.</p>
      </div>
    );
  }

  const currentPost = posts[currentIndex];

  return (
    <div className="hidden lg:block relative max-w-md mx-auto">
      {/* Card Container */}
      <motion.div 
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="group cursor-pointer"
      >
        <Link href={`/articles/${currentPost.slug.current}`} className="block h-full">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden relative shadow-2xl">
            {currentPost.image ? (
              <Image
                src={urlForImage(currentPost.image).url()}
                alt={currentPost.title}
                width={400}
                height={300}
                className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 group-hover:scale-110 transition-all duration-500 flex items-center justify-center">
                <span className="text-neutral-500 text-lg font-medium">Article {currentPost._id.slice(-3)}</span>
              </div>
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-500" />
            
            {/* Content overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <p className="text-sm text-white/60 mb-3">issue #{currentPost._id.slice(-3)} — {new Date(currentPost.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              <h3 className="text-xl font-semibold text-white mb-1 mt-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                {currentPost.title}
              </h3>
              <p className="text-white/90 text-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 line-clamp-2">
                {new Date(currentPost.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Progress dots indicator */}
      {posts.length > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {posts.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-neutral-900 w-8' : 'bg-neutral-400 w-2'
              }`}
            />
          ))}
        </div>
      )}

      {/* Article counter */}
      {posts.length > 1 && (
        <div className="text-center mt-2 text-sm text-neutral-600">
          {currentIndex + 1} of {posts.length} articles
        </div>
      )}
    </div>
  );
}

export default function LandingClient({ posts}: { posts: ArticleCardPost[]}) {
  const builder = imageUrlBuilder(client);
  const [typedText, setTypedText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const indexRef = useRef(0);
  const router = useRouter();
  const { isSubscribed, loading } = useSubscriptionContext();
  
  // Refs for scroll detection
  // const aboutSectionRef = useRef<HTMLDivElement>(null);
  // const opportunitiesRef = useRef<HTMLDivElement>(null);
  // const isInView = useInView(aboutSectionRef, { 
  //   once: true, 
  //   margin: "-50%"
  // });
  // const opportunitiesInView = useInView(opportunitiesRef, { 
  //   once: true, 
  //   margin: "-50%"
  // });

  const fullText = 'Our goal is to introduce you directly to opportunities and founders at some of the highest growth startups while helping you curate a personalized, professional network that aligns with your interests, skillsets, and verified by your existing professional community. Accessible only be referral.';

  function urlForImage(source: SanityImageSource) {
    return builder.image(source);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = indexRef.current + 1;
      const nextText = fullText.slice(0, nextIndex);
      setTypedText(nextText);
      indexRef.current = nextIndex;

      if (nextIndex >= fullText.length) {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Check demo status and route to tour if needed
  useEffect(() => {
    const checkDemoStatus = async () => {
      if (!loading && isSubscribed) {
        try {
          const response = await fetch('/api/check_demo_status');
          if (response.ok) {
            const data = await response.json();
            console.log('Demo status:', data);
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
      {/* First section - Hero with full height */}
      <div className="min-h-[100dvh] flex flex-col">
        <div className="flex flex-1 flex-col lg:flex-row w-full max-w-[1400px] px-2 sm:px-4 lg:px-6 mx-auto py-8 sm:py-12 lg:py-16 gap-8 lg:gap-16 items-center overflow-hidden">
        
          {/* Right side - Text content (shows first on mobile) */}
          <div className="flex-1 flex flex-col justify-start pt-8 lg:pt-16 px-4 sm:px-8 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative"
            >
              <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-neutral-800 text-center lg:text-left">
                Discover Your Niche of Opportunities
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-neutral-600 mb-6 md:mb-10 text-center lg:text-left">
                {(() => {
                  // Words to highlight
                  const personalizedIdx = typedText.indexOf("personalized");
                  const verifiedIdx = typedText.indexOf("verified");
                  
                  let result = typedText;
                  
                  // Apply highlighting for "personalized"
                  if (personalizedIdx !== -1) {
                    const personalizedEnd = Math.min(personalizedIdx + "personalized".length, typedText.length);
                    const personalizedTyped = typedText.slice(personalizedIdx, personalizedEnd);
                    if (personalizedTyped.length > 0) {
                      result = result.replace(personalizedTyped, `<strong>${personalizedTyped}</strong>`);
                    }
                  }
                  
                  // Apply highlighting for "verified"
                  if (verifiedIdx !== -1) {
                    const verifiedEnd = Math.min(verifiedIdx + "verified".length, typedText.length);
                    const verifiedTyped = typedText.slice(verifiedIdx, verifiedEnd);
                    if (verifiedTyped.length > 0) {
                      result = result.replace(verifiedTyped, `<strong>${verifiedTyped}</strong>`);
                    }
                  }
                  
                  return <span dangerouslySetInnerHTML={{ __html: result }} />;
                })()}
                <span className="animate-pulse text-neutral-400">{!typingDone && '|'}</span>
                {typingDone && (
                  <span className="inline-block px-4 py-2 mt-4 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-purple-500 rounded-full shadow-lg animate-pulse">
                    BETA
                  </span>
                )}
              </p>
              <div className="flex justify-center lg:justify-start">
                <Subscribe/>
              </div>
              
            </motion.div>
          </div>

          {/* Left side - Animated Overlapping Article Cards (shows second on mobile) */}
          <div className="flex-1 w-full order-2 lg:order-1">
            {/* Mobile layout - horizontal scroll */}
            <div className="block lg:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory px-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {posts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    className="flex-shrink-0 w-72 h-80 group cursor-pointer snap-start first:ml-0 last:mr-4"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Link href={`/articles/${post.slug.current}`} className="block h-full">
                      <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-2xl">
                        {post.image ? (
                          <Image
                            src={urlForImage(post.image).url()}
                            alt={post.title}
                            width={256}
                            height={320}
                            className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-200 group-hover:scale-110 transition-all duration-500" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-500" />
                        <div className="absolute inset-0 p-4 flex flex-col justify-end">
                          <p className="text-xs text-white/60 mb-2">issue #{post._id.slice(-3)} — {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          <h3 className="text-lg font-medium text-white mb-1">{post.title}</h3>
                          <p className="text-white/75 text-xs">
                            {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Desktop layout - vertical carousel */}
            <VerticalArticleCarousel posts={posts} urlForImage={urlForImage} />
          </div>
        </div>
        
      </div>



      
    </div>
  );
}