"use client";
import Link from "next/link";
import Image from "next/image";
import imageUrlBuilder from '@sanity/image-url';
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";
import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { ArticleCardPost } from "./article_issues";
import NeuralRainbowNetwork from "@/app/components/rainbow_graph";
import {Subscribe} from "@/app/components/subscribe";

export default function LandingClient({ posts }: { posts: ArticleCardPost[] }) {
  const builder = imageUrlBuilder(client);
  const pathname = usePathname();
  const [typedText, setTypedText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const indexRef = useRef(0);
  
  // Refs for scroll detection
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const secondSectionRef = useRef<HTMLDivElement>(null);
  const opportunitiesRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(aboutSectionRef, { 
    once: true, 
    margin: "-50%"
  });
  const secondSectionInView = useInView(secondSectionRef, { 
    once: true, 
    margin: "-50%"
  });
  const opportunitiesInView = useInView(opportunitiesRef, { 
    once: true, 
    margin: "-50%"
  });

  const fullText = 'Connect, discover, and grow with a personalized and verified professional network of opportunities. Accessible only be referral in this public beta. ';

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
              {pathname === '/access' && (
                <div className="flex justify-center lg:justify-start">
                  <Subscribe/>
                </div>
              )}
            </motion.div>
          </div>

          {/* Left side - Animated Overlapping Article Cards (shows second on mobile) */}
          <div className="flex-1 w-full order-2 lg:order-1">
            {/* Mobile layout - horizontal scroll */}
            <div className="block lg:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory px-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {posts.slice(0, 3).map((post, index) => (
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

            {/* Desktop layout - overlapping cards */}
            <div className="hidden lg:block relative h-[600px] w-full">
              {posts.slice(0, 3).map((post, index) => (
                <motion.div
                  key={post._id}
                  className="absolute w-80 h-96 group cursor-pointer"
                  initial={{ 
                    x: -50, 
                    y: 100,
                    rotate: -10,
                    opacity: 0 
                  }}
                  animate={{ 
                    x: 60 + index * 120,
                    y: index * 80,
                    rotate: index * 20 - 20,
                    opacity: 1
                  }}
                  transition={{ 
                    duration: 0.8,
                    delay: index * 0.2,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    rotate: 0,
                    zIndex: 10,
                    transition: { duration: 0.3 }
                  }}
                  style={{ zIndex: posts.length - index }}
                >
                  <Link href={`/articles/${post.slug.current}`} className="block h-full">
                    <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-2xl">
                      {post.image ? (
                        <Image
                          src={urlForImage(post.image).url()}
                          alt={post.title}
                          width={320}
                          height={384}
                          className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-200 group-hover:scale-110 transition-all duration-500" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-500" />
                      <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <p className="text-sm text-white/60 mb-3">issue #{post._id.slice(-3)} — {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <h3 className="text-xl font-medium text-white mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">{post.title}</h3>
                        <p className="text-white/75 text-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                          {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom button - Fixed at bottom of screen */}
        <div className="w-full flex justify-center gap-4 sm:gap-6 pb-8 lg:pb-16 px-4 mt-auto">
          <button 
            onClick={() => {
              if (aboutSectionRef.current) {
                const elementTop = aboutSectionRef.current.offsetTop;
                window.scrollTo({
                  top: elementTop,
                  behavior: 'smooth'
                });
              }
            }}
            className="inline-flex items-center px-4 sm:px-6 lg:px-8 py-3 lg:py-4 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 rounded-full transition-all duration-200 font-medium text-sm sm:text-base lg:text-lg shadow-sm hover:shadow-md"
          >
            How does it work?
            <svg 
              className="ml-2 h-5 w-5 transform transition-transform hover:translate-y-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* About Page Section - Full height with button at bottom */}
      <motion.div 
        ref={aboutSectionRef}
        initial={{ opacity: 0, y: 150 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 150 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-100 flex flex-col shadow-2xl border-t border-neutral-200"
      >
        <div className="flex flex-1 flex-col lg:flex-row w-full max-w-[1400px] px-2 sm:px-4 lg:px-6 mx-auto py-8 sm:py-12 gap-8 lg:gap-16 items-center">
          {/* Left side - Text content */}
          <div className="flex-[3] flex flex-col justify-center px-4 sm:px-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-6 lg:mb-8 text-neutral-800 leading-relaxed text-center lg:text-left">
                Personalizing and Verifying Your Network
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-neutral-600 mb-8 lg:mb-12 leading-relaxed text-center lg:text-left">
                Indexing on skills, networks, and interests to personalize the opportunities that come your way, matching you 
                with unparalleled accuracy to an exclusive cohort of people and companies 
              </p>
              
              <div className="space-y-8">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-neutral-800 mb-4 lg:mb-6 text-center lg:text-left">How do we do this?</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="font-medium text-neutral-800 text-sm sm:text-base">Verification</h3>
                      <p className="text-xs sm:text-sm text-neutral-600">We ingest verifiable data that you provide on your background</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="font-medium text-neutral-800 text-sm sm:text-base">Personalization</h3>
                      <p className="text-xs sm:text-sm text-neutral-600">You build your profile, indexing on your interests, competencies, and existing networks</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="font-medium text-neutral-800 text-sm sm:text-base">Matching</h3>
                      <p className="text-xs sm:text-sm text-neutral-600">We connect you to exclusive opportunities to founders, investors, and startups, indexing on verifiable and personalized data that you curated and that we built out</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Right side - Large Rainbow Network */}
          <div className="hidden sm:flex flex-[3] relative w-full items-center justify-center perspective-[1000px] order-first lg:order-last">
            <motion.div
              className="w-full h-[300px] sm:h-[400px] lg:h-[600px]"
              initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
              animate={isInView ? {
                opacity: 1,
                scale: 1,
                rotateY: [0, 15, -15, 0],
                rotateX: [0, 10, -10, 0],
              } : {
                opacity: 0,
                scale: 0.8,
                rotateY: -30
              }}
              transition={{
                opacity: { duration: 1.2, delay: 0.6 },
                scale: { duration: 1.2, delay: 0.6 },
                rotateY: { duration: 8, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 1 },
                rotateX: { duration: 8, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 1 }
              }}
              style={{
                transformStyle: "preserve-3d"
              }}
            >
              <NeuralRainbowNetwork className="absolute inset-0" nodeCount={50} avgDegree={10} seedEveryMs={3000} pulseSpeed={320}/>
              <NeuralRainbowNetwork className="absolute inset-0" nodeCount={20} avgDegree={5} seedEveryMs={2000} pulseSpeed={320}/>
            </motion.div>
          </div>
        </div>
        
        {/* Button to next section at bottom of about section */}
        <div className="w-full flex justify-center items-center pb-8 lg:pb-16 px-4 mt-auto">
          <button 
            onClick={() => {
              secondSectionRef.current?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }}
            className="inline-flex items-center px-4 sm:px-6 lg:px-8 py-3 lg:py-4 bg-neutral-900 text-white hover:bg-neutral-800 rounded-full transition-all duration-200 font-medium text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-xl"
          >
            Connect and Send Outbound to Specific Verified Networks
            <svg 
              className="ml-2 h-5 w-5 transform transition-transform hover:translate-y-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Second Section - Full height with button at bottom */}
      <motion.div 
        ref={secondSectionRef}
        initial={{ opacity: 0, y: 150 }}
        animate={secondSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 150 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="min-h-screen bg-gradient-to-b from-neutral-100 via-white to-neutral-50 flex flex-col shadow-2xl border-t border-neutral-200"
      >
        <div className="flex flex-1 flex-col lg:flex-row w-full max-w-[1400px] px-2 sm:px-4 lg:px-6 mx-auto py-8 sm:py-12 gap-8 lg:gap-16 items-center">
          {/* Right side - Text content */}
          <div className="flex-[3] flex flex-col justify-center px-4 sm:px-8 order-2 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={secondSectionInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-6 lg:mb-8 text-neutral-800 leading-relaxed text-center lg:text-left">
                Build Your Human Capital Network
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-neutral-600 mb-8 lg:mb-12 leading-relaxed text-center lg:text-left">
                Connect and build a verified, personalized, professional community on The Niche so that the opportunities that come your way are custom-tailored to the network you have already built. Likewise, customize outbound about professional events and opportunities to a network of your choice and a verifiable audience that you customize. 
              </p>
              
              <div className="space-y-8">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-neutral-800 mb-4 lg:mb-6 text-center lg:text-left">Why does this matter?</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="font-medium text-neutral-800 text-sm sm:text-base">Verified and Curated Professional Network</h3>
                      <p className="text-xs sm:text-sm text-neutral-600">Connect with people on the network that are representative of your verified professional network. Who you choose to verify as part of your professional network on The Niche helps us surface opportunities to you that your network is also interested in. </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="font-medium text-neutral-800 text-sm sm:text-base">Tailor Your Outbound</h3>
                      <p className="text-xs sm:text-sm text-neutral-600">Utilize your verified, professional network on The Niche to send personalized outbound on professional opportunities, events, updates, etc. to select network audiences. </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Left side - Large Rainbow Network */}
          <div className="hidden sm:flex flex-[3] relative w-full items-center justify-center perspective-[1000px] order-1 lg:order-1">
            <motion.div
              className="w-full h-[300px] sm:h-[400px] lg:h-[600px]"
              initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
              animate={secondSectionInView ? {
                opacity: 1,
                scale: 1,
                rotateY: [0, -15, 15, 0],
                rotateX: [0, -10, 10, 0],
              } : {
                opacity: 0,
                scale: 0.8,
                rotateY: 30
              }}
              transition={{
                opacity: { duration: 1.2, delay: 0.6 },
                scale: { duration: 1.2, delay: 0.6 },
                rotateY: { duration: 10, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 1 },
                rotateX: { duration: 10, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 1 }
              }}
              style={{
                transformStyle: "preserve-3d"
              }}
            >
              <NeuralRainbowNetwork className="absolute inset-0" nodeCount={30} avgDegree={8} seedEveryMs={2500} pulseSpeed={280}/>
              <NeuralRainbowNetwork className="absolute inset-0" nodeCount={15} avgDegree={6} seedEveryMs={1800} pulseSpeed={350}/>
            </motion.div>
          </div>
        </div>
        
        {/* Opportunities button at bottom of second section */}
        <div className="w-full flex justify-center items-center pb-8 lg:pb-16 px-4 mt-auto">
          <button 
            onClick={() => {
              opportunitiesRef.current?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }}
            className="inline-flex items-center px-4 sm:px-6 lg:px-8 py-3 lg:py-4 bg-neutral-900 text-white hover:bg-neutral-800 rounded-full transition-all duration-200 font-medium text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-xl"
          >
            Opportunities in our Public Beta
            <svg 
              className="ml-2 h-5 w-5 transform transition-transform hover:translate-y-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Opportunities Section - Partner Companies Gallery */}
      <motion.div 
        ref={opportunitiesRef}
        initial={{ opacity: 0, y: 150 }}
        animate={opportunitiesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 150 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="min-h-screen bg-gradient-to-b from-white via-neutral-100 to-neutral-50 flex flex-col shadow-2xl border-t border-neutral-200"
      >
        <div className="flex flex-1 flex-col w-full max-w-[1400px] px-2 sm:px-4 lg:px-6 mx-auto py-8 sm:py-12 lg:py-16 gap-8 lg:gap-12 items-center justify-center">
          {/* Text content */}
          <div className="w-full flex flex-col justify-center text-center px-4 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={opportunitiesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-6 lg:mb-8 text-neutral-800 leading-relaxed">
                Opportunities in our Public Beta
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-neutral-600 mb-8 lg:mb-12 leading-relaxed max-w-4xl mx-auto">
              Connect, discover, and grow with a personalized and verified professional network of opportunities. In this public beta, opportunities partnered with The Niche are fast-tracked and go straight to the founder&apos;s inbox. If there is mutual interest from them, we immediately connect you straight to them. Non-partner companies are just a resource for you to explore.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}