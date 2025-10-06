"use client";
import Link from "next/link";
import Image from "next/image";
import imageUrlBuilder from '@sanity/image-url';
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { ArticleCardPost } from "./article_issues";
import {Subscribe} from "@/app/components/subscribe";

// // Automatic Rolling Company Carousel Component
// function CompanyCarousel({ items }: { items: MediaLibraryItem[] }) {
//   const builder = imageUrlBuilder(client);
//   const [currentIndex, setCurrentIndex] = useState(0);
  

//   function urlForImage(source: SanityImageSource) {
//     return builder.image(source);
//   }
  
//   // Safety check and filter to show only partners and pending partners
//   const filteredItems = (items || []).filter(item => item.partner || item.pending_partner);
  
//   // Auto-scroll functionality
//   useEffect(() => {
//     let interval: NodeJS.Timeout | null = null;
    
//     if (filteredItems.length > 1) {
//       interval = setInterval(() => {
//         setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
//       }, 4000); // Change slide every 4 seconds
//     }
    
//     return () => {
//       if (interval) {
//         clearInterval(interval);
//       }
//     };
//   }, [filteredItems.length]);

//   if (filteredItems.length === 0) {
//     return (
//       <div className="text-center py-8">
//         <p className="text-neutral-600">No partner companies available at the moment.</p>
//       </div>
//     );
//   }

//   const currentItem = filteredItems[currentIndex];

//   return (
//     <div className="relative max-w-md mx-auto">
//       {/* Card Container */}
//       <motion.div 
//         key={currentIndex}
//         initial={{ opacity: 0, scale: 0.9, y: 20 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         exit={{ opacity: 0, scale: 0.9, y: -20 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//         className="group cursor-pointer"
//       >
//         <div className="aspect-[4/3] rounded-2xl overflow-hidden relative shadow-2xl">
//           {currentItem.image ? (
//             <Image
//               src={urlForImage(currentItem.image).url()}
//               alt={currentItem.alt || currentItem.caption || `Company ${currentItem.company}`}
//               width={400}
//               height={300}
//               className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
//             />
//           ) : (
//             <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 group-hover:scale-110 transition-all duration-500 flex items-center justify-center">
//               <span className="text-neutral-500 text-lg font-medium">Company {currentItem.company}</span>
//             </div>
//           )}
          
//           {/* Gradient overlay */}
//           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-500" />
          
//           {/* Content overlay */}
//           <div className="absolute inset-0 p-6 flex flex-col justify-end">
//             {/* Partner badge */}
//             {/* Caption/Title - positioned lower */}
//             {currentItem.caption && (
//               <h3 className="text-xl font-semibold text-white mb-1 mt-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
//                 {currentItem.caption}
//               </h3>
//             )}
//              {currentItem.alt && (
//               <h2 className="text-xl font-semibold text-white mb-1 mt-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
//                 {currentItem.alt}
//               </h2>
//             )}
            
//             {/* Description */}
//             {currentItem.description && (
//               <p className="text-white/90 text-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 line-clamp-2">
//                 {currentItem.description}
//               </p>
//             )}
            
//             {/* Location */}
//             {currentItem.location && (
//               <p className="text-white/75 text-xs mt-2 transform translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
//                 📍 {currentItem.location}
//               </p>
//             )}
          
//           </div>
//         </div>
//       </motion.div>

//       {/* Progress dots indicator */}
//       {filteredItems.length > 1 && (
//         <div className="flex justify-center mt-4 gap-2">
//           {filteredItems.map((_, index) => (
//             <div
//               key={index}
//               className={`h-1 rounded-full transition-all duration-300 ${
//                 index === currentIndex ? 'bg-neutral-900 w-8' : 'bg-neutral-400 w-2'
//               }`}
//             />
//           ))}
//         </div>
//       )}

//       {/* Company counter */}
//       {filteredItems.length > 1 && (
//         <div className="text-center mt-2 text-sm text-neutral-600">
//           {currentIndex + 1} of {filteredItems.length} partner companies
//         </div>
//       )}
//     </div>
//   );
// }

export default function LandingClient({ posts}: { posts: ArticleCardPost[]}) {
  const builder = imageUrlBuilder(client);
  const pathname = usePathname();
  const [typedText, setTypedText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const indexRef = useRef(0);
  
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
        
      </div>



      
    </div>
  );
}