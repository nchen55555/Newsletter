'use client'
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import { ProfileData } from "@/app/types";
import React, { useState, useEffect } from "react";
// import Image from "next/image";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

// function ProfileCard({ profile, onClick }: { profile: ProfileData; onClick: () => void }) {
//   const [imageLoaded, setImageLoaded] = useState(false);
//   const [imageError, setImageError] = useState(false);

//   return (
//     <div className="group cursor-pointer" onClick={onClick}>
//       <div className="bg-white border border-neutral-200 rounded-2xl hover:shadow-lg transition-all duration-300 p-8 h-full">
//         {/* Profile Image */}
//         <div className="w-32 h-32 mx-auto mb-6 overflow-hidden rounded-full relative">
//           {profile.profile_image_url && !imageError ? (
//             <>
//               {!imageLoaded && (
//                 <Skeleton className="w-full h-full rounded-full absolute inset-0" />
//               )}
//               <Image
//                 src={profile.profile_image_url}
//                 alt={`${profile.first_name} ${profile.last_name}`}
//                 width={128}
//                 height={128}
//                 className={`w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300 ${
//                   imageLoaded ? 'opacity-100' : 'opacity-0'
//                 }`}
//                 onLoad={() => setImageLoaded(true)}
//                 onError={() => setImageError(true)}
//               />
//             </>
//           ) : (
//             <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center text-neutral-600 font-bold text-2xl">
//               {profile.first_name[0]}{profile.last_name[0]}
//             </div>
//           )}
//         </div>
        
//         {/* Name */}
//         <h3 className="text-xl font-semibold text-neutral-900 mb-2 text-center">
//           {profile.first_name} {profile.last_name}
//         </h3>
    
        
//         {/* University */}
//         <p className="text-sm text-neutral-500 text-center">
//           {profile.email.split('@')[1].split('.')[0].charAt(0).toUpperCase() + profile.email.split('@')[1].split('.')[0].slice(1)}
//         </p>
//       </div>
//     </div>
//   );
// }



// Profile Card Skeleton Component
function ProfileCardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-8 h-full">
      {/* Profile Image Skeleton */}
      <Skeleton className="w-32 h-32 mx-auto mb-6 rounded-full" />
      
      {/* Name Skeleton */}
      <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
      
      {/* Major Skeleton */}
      <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
      
      {/* University Skeleton */}
      <Skeleton className="h-4 w-2/3 mx-auto mb-4" />
      
      {/* Bio Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

// Loading Skeleton for entire page
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
      <Navigation />
      <Container>
        <div className="max-w-6xl mx-auto py-8 md:py-16 px-4 md:px-6">
          {/* Header Section Skeleton */}
          <div className="mb-10">
            <Skeleton className="h-8 md:h-12 w-1/3 mb-4" />
            <Skeleton className="h-4 md:h-6 w-full mb-2" />
            <Skeleton className="h-4 md:h-6 w-3/4" />
          </div>

          {/* Profiles Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>

          {/* Call to Action Skeleton */}
          <div className="mt-12 text-center">
            <Skeleton className="h-6 w-1/4 mx-auto mb-4" />
            <Skeleton className="h-4 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-12 w-32 mx-auto" />
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function PeoplePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Show skeleton for 1 second

    return () => clearTimeout(timer);
  }, []);

  // const handleProfileClick = (profile: ProfileData) => {
  //   router.push(`/people/${profile.id}`);
  // };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
      <Navigation />
      <Container>
        <div className="max-w-6xl mx-auto py-8 md:py-16 px-4 md:px-6">
          {/* Header Section */}
          <div className="mb-10">
            <h1 className="text-2xl md:text-4xl font-bold mb-4 text-neutral-800">
              our community
            </h1>
            <p className="text-base md:text-lg text-neutral-600 mb-6 md:mb-10">
              <strong>SOON </strong>meet the talented students from <span className="relative group inline-block align-middle">
                <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                  top universities
                </span>
                <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-[90vw] md:max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-3 md:px-4 py-2 text-sm md:text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                  Harvard, MIT, Stanford, and Berkeley students hand-picked through academic and industry recommendations
                </span>
              </span> who are part of our exclusive community, ready to connect with high-growth startups.
            </p>
          </div>

          {/* Profiles Grid */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {mockProfiles.map((profile) => (
              <ProfileCard 
                key={profile.id} 
                profile={profile} 
                onClick={() => handleProfileClick(profile)}
              />
            ))}
          </div> */}
        </div>
      </Container>


    </div>
  );
}