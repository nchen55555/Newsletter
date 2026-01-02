"use client"

import Image from "next/image";
import type { ReactNode } from "react";

interface FrontProfileProps {
  profileImage: string;
  name: string;
  /** Text shown in the message bubble */
  message: string;
  /** Optional icon to render next to the message text */
  icon?: ReactNode;
  /** Controls which side of the avatar the text bubble appears on */
  messageSide?: 'left' | 'right';
}

export default function FrontProfile({
  profileImage,
  name,
  message,
  icon,
  messageSide = 'right',
}: FrontProfileProps) {
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
      
      {/* Message bubble - overlapping avatar, can be to left or right */}
      <div
        className={`absolute top-8 sm:top-10 lg:top-12 z-10 ${
          messageSide === 'left'
            ? 'right-12 sm:right-14 lg:right-16'
            : 'left-12 sm:left-14 lg:left-16'
        }`}
      >
        <div className="flex items-center gap-3 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-white/10 min-w-max">
          {icon && (
            <span className="flex items-center justify-center">
              {icon}
            </span>
          )}
          <div className="text-sm font-medium text-gray-200 whitespace-nowrap">
            <span>{message}</span>
          </div>
        </div>
        {/* Arrow pointing to avatar */}
        <div
          className={`absolute top-1/2 transform -translate-y-1/2 w-0 h-0 ${
            messageSide === 'left'
              ? '-right-2 border-l-4 border-l-white/20 border-y-4 border-y-transparent'
              : '-left-2 border-r-4 border-r-white/20 border-y-4 border-y-transparent'
          }`}
        ></div>
      </div>
    </div>
  );
}