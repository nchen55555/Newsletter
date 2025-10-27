"use client"

import Image from "next/image";
import { Send } from 'lucide-react';

interface FrontProfileProps {
  profileImage: string;
  name: string;
  messageType: 'intro' | 'recommendation' | 'thoughts';
}

export default function FrontProfile({ profileImage, name, messageType }: FrontProfileProps) {
  const getMessage = () => {
    switch (messageType) {
      case 'intro':
        return 'Requested an intro to Unify';
      case 'recommendation':
        return `Recommended ${name} to Moment`;
      case 'thoughts':
        return 'Threaded an update on his offer to Moment';
      default:
        return 'Requested an intro';
    }
  };
  return (
    <div className="relative">
      {/* Profile avatar */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
        <Image
          src={profileImage}
          alt={`${name} Profile`}
          width={96}
          height={96}
          className="w-full h-full rounded-full object-cover border-3 border-white shadow-lg"
        />
      </div>
      
      {/* Message bubble - overlapping bottom right of avatar */}
      <div className="absolute top-8 left-12 sm:top-10 sm:left-14 lg:top-12 lg:left-16 z-10">
        <div className="flex items-center gap-3 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-white/10 min-w-max">
          <Send className="h-4 w-4" />
          <div className="text-sm font-medium text-gray-800 whitespace-nowrap">
            <span>{getMessage()}</span>
          </div>
        </div>
        {/* Arrow pointing to avatar */}
        <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-0 h-0 border-r-4 border-r-white/20 border-y-4 border-y-transparent"></div>
      </div>
    </div>
  );
}