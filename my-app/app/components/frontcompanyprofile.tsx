"use client"

import Image from "next/image";
interface MediaLibraryItem {
  _id: string;
  image: string;
  alt: string;
  company: string;
}

interface FrontCompanyProfileProps {
  mediaLibrary: MediaLibraryItem[];
  companyId: string;
  companyName: string;
  description: string;
}

export default function FrontCompanyProfile({ 
  mediaLibrary, 
  companyId, 
  companyName, 
  description 
}: FrontCompanyProfileProps) {
  // Find company by ID or name
  let company = mediaLibrary.find(item => 
    item.company === companyId || 
    item.company === companyName.toLowerCase() || 
    item.alt?.toLowerCase().includes(companyName.toLowerCase())
  );
  
  if (!company) {
    company = mediaLibrary[0]; // fallback to first item
  }

  if (!company) {
    return null;
  }

  return (
    <div className="rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-white/20 w-48 h-72 sm:w-56 sm:h-80 lg:w-64 lg:h-96 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-white/40 cursor-pointer relative">      
      
      <div className="flex flex-col items-center text-center space-y-6 h-full">
        <div className="flex justify-center">
          <Image
            src={company.image}
            alt={company.alt}
            width={180}
            height={80}
            className="object-contain w-24 h-12 sm:w-32 sm:h-16 lg:w-40 lg:h-20"
          />
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-black mb-2 sm:mb-3 lg:mb-4">{companyName}</h3>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}