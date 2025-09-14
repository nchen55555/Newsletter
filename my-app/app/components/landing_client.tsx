"use client";
import Link from "next/link";
import Image from "next/image";
import imageUrlBuilder from '@sanity/image-url';
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";
import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { ArticleCardPost } from "./article_issues";
import type { CompanyWithImageUrl } from "@/app/types";
import NeuralRainbowNetwork from "@/app/components/rainbow_graph";
import {Subscribe} from "@/app/components/subscribe";

export default function LandingClient({ posts }: { posts: ArticleCardPost[] }) {
  const builder = imageUrlBuilder(client);
  const [typedText, setTypedText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const [companies, setCompanies] = useState<CompanyWithImageUrl[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const indexRef = useRef(0);
  
  // Refs for scroll detection
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const opportunitiesRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(aboutSectionRef, { 
    once: true, 
    margin: "-50%"
  });
  const opportunitiesInView = useInView(opportunitiesRef, { 
    once: true, 
    margin: "-50%"
  });

  const fullText = 'Connect, discover, and grow with a personalized and verified professional network of opportunities';

  function urlForImage(source: SanityImageSource) {
    return builder.image(source);
  }

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await fetch('/api/companies');
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      const companiesData = await response.json();
      setCompanies(companiesData.slice(0, 20)); // Limit to 20 companies for the grid
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

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

  useEffect(() => {
    fetchCompanies();
  }, []);
  
  return (
    <div>
    <div className="flex flex-1 flex-col lg:flex-row w-full max-w-[1400px] px-8 mx-auto py-42 gap-16 items-center">
      {/* Left side - Animated Overlapping Article Cards */}
      <div className="flex-1 relative h-[600px] w-full">
        {posts.slice(0, 3).map((post, index) => (
          <motion.div
            key={post._id}
            className="absolute w-80 h-96 group cursor-pointer"
            initial={{ 
              x: -100, 
              y: 100,
              rotate: -10,
              opacity: 0 
            }}
            animate={{ 
              x: index * 140,
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
      
      {/* Right side - Text content */}
      <div className="flex-1 flex flex-col justify-start pt-16 px-8">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative"
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-neutral-800">
            Discover Your Niche of Opportunities
          </h1>
          <p className="text-base md:text-lg text-neutral-600 mb-6 md:mb-10">
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
              <span className="inline-block px-3 py-1 ml-2 text-sm font-bold text-white bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-lg animate-pulse">
                BETA
              </span>
            )}
          </p>
          <Subscribe/>
        </motion.div>
      </div>
      
    </div>
    
    {/* Bottom buttons - Bottom of main section */}
    <div className="w-full flex justify-center gap-6 -mt-8 pb-16">
      <button 
        onClick={() => {
          aboutSectionRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }}
        className="inline-flex items-center px-8 py-4 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 rounded-full transition-all duration-200 font-medium text-lg shadow-sm hover:shadow-md"
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
    
    {/* About Page Section - New Window - COMPLETELY SEPARATE */}
    <motion.div 
      ref={aboutSectionRef}
      initial={{ opacity: 0, y: 150 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 150 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-100 flex flex-col shadow-2xl border-t border-neutral-200"
    >
      <div className="flex flex-1 flex-col lg:flex-row w-full max-w-[1400px] px-8 mx-auto py-12 gap-16 items-center min-h-screen">
        {/* Left side - Text content */}
        <div className="flex-[3] flex flex-col justify-center px-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          >
            <h1 className="text-2xl md:text-4xl font-bold mb-8 text-neutral-800 leading-relaxed">
              Personalizing and Verifying Your Network
            </h1>
            <p className="text-base md:text-lg text-neutral-600 mb-12 leading-relaxed">
              Indexing on skills, networks, and interests to personalize the opportunities that come your way, matching you 
              with unparalleled accuracy to an exclusive cohort of people and companies 
            </p>
            
            <div className="space-y-8">
              <h2 className="text-lg md:text-xl font-semibold text-neutral-800 mb-6">How do we do this?</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div>
                    <h3 className="font-medium text-neutral-800">Verification</h3>
                    <p className="text-sm text-neutral-600">We ingest verifiable data that you provide on your background</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div>
                    <h3 className="font-medium text-neutral-800">Personalization</h3>
                    <p className="text-sm text-neutral-600">You build your profile, indexing on your interests, competencies, and existing networks</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div>
                    <h3 className="font-medium text-neutral-800">Matching</h3>
                    <p className="text-sm text-neutral-600">We connect you to exclusive opportunities to founders, investors, and startups, indexing on verifiable and personalized data that you curated and that we built out</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Right side - Large Rainbow Network */}
        <div className="flex-[3] relative w-full flex items-center justify-center perspective-[1000px]">
          <motion.div
            className="w-full h-[600px]"
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
      
      {/* Opportunities button at bottom of about section */}
      <div className="w-full flex justify-center items-center -mt-8 pb-16">
        <button 
          onClick={() => {
            opportunitiesRef.current?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }}
          className="inline-flex items-center px-8 py-4 bg-neutral-900 text-white hover:bg-neutral-800 rounded-full transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl"
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
      <div className="flex flex-1 flex-col w-full max-w-[1400px] px-8 mx-auto py-16 gap-12 items-center min-h-screen">
      {/* Text content */}
      <div className="w-full flex flex-col justify-center text-center px-8">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={opportunitiesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        >
          <h1 className="text-2xl md:text-4xl font-bold mb-8 text-neutral-800 leading-relaxed">
            Opportunities in our Public Beta
          </h1>
          <p className="text-base md:text-lg text-neutral-600 mb-12 leading-relaxed max-w-4xl mx-auto">
          We have already partnered with 7 of the fastest-growing, high-talent pool startups within our network. They are working with The Niche to curate their verified and personalized network of <strong>perfect matches </strong>. Join the network to connect with them. In the future, we expect to onboard even more partners to curate an even more personalized network of opportunities for you. 
          </p>
        </motion.div>
      </div>

      {/* Bottom - Marquee Company Logos */}
      <div className="w-full relative flex items-center justify-center">
        <motion.div
          className="w-full overflow-hidden"  
          initial={{ opacity: 0, scale: 0.9 }}
          animate={opportunitiesInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
        >
          {loadingCompanies ? (
            <div className="flex space-x-8 animate-pulse">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={`loading-${index}`} className="flex-shrink-0 w-32 h-16 bg-neutral-200 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="relative">
              {/* Marquee container */}
              <div className="flex animate-marquee hover:pause-marquee">
                {companies.map((company) => (
                  <div
                    key={`first-${company._id}`}
                    className="flex-shrink-0 mx-12 flex items-center justify-center w-48 h-24"
                  >
                    {company.imageUrl ? (
                      <Image
                        src={company.imageUrl}
                        alt={company.company?.toString() || "Company logo"}
                        width={180}
                        height={90}
                        className="max-w-full max-h-full object-contain transition-all duration-300 opacity-80 hover:opacity-100"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-neutral-400 font-bold text-2xl">
                        {company.company?.toString().charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                ))}
                {companies.map((company) => (
                  <div
                    key={`second-${company._id}`}
                    className="flex-shrink-0 mx-12 flex items-center justify-center w-48 h-24"
                  >
                    {company.imageUrl ? (
                      <Image
                        src={company.imageUrl}
                        alt={company.company?.toString() || "Company logo"}
                        width={180}
                        height={90}
                        className="max-w-full max-h-full object-contain transition-all duration-300 opacity-80 hover:opacity-100"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-neutral-400 font-bold text-2xl">
                        {company.company?.toString().charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </motion.div>
    </div>
  );
}
