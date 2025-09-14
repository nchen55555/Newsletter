"use client"

import Image from "next/image"
import { CompanyData } from "../opportunities/page"

interface OpportunityGraphProps {
  companies: CompanyData[]
  profileImageUrl?: string
}

export function OpportunityGraph({ companies, profileImageUrl }: OpportunityGraphProps) {
  const displayedCompanies = companies.slice(0, 8) // Increased to 8 companies
  
  return (
    <div className="relative w-full h-[500px] mb-16 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 rounded-3xl overflow-hidden">
      {/* Floating background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-gradient-to-r from-emerald-200/30 to-blue-200/30 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      {/* Connection lines with glow effect */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {displayedCompanies.map((_, index) => {
          const angle = (index * 360) / displayedCompanies.length
          const centerX = 50
          const centerY = 50
          const radius = 32
          const endX = centerX + radius * Math.cos((angle * Math.PI) / 180)
          const endY = centerY + radius * Math.sin((angle * Math.PI) / 180)
          
          return (
            <g key={`line-${index}`}>
              <line
                x1={`${centerX}%`}
                y1={`${centerY}%`}
                x2={`${endX}%`}
                y2={`${endY}%`}
                stroke="url(#connectionGradient)"
                strokeWidth="3"
                strokeDasharray="8,4"
                filter="url(#glow)"
                className="animate-pulse"
                style={{
                  animationDelay: `${index * 200}ms`,
                  animationDuration: '3s'
                }}
              />
            </g>
          )
        })}
      </svg>

      {/* Center profile image with 3D effect */}
      <div 
        className="absolute transform-gpu"
        style={{ 
          zIndex: 10,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="relative">
          {/* Shadow base */}
          <div className="absolute inset-0 bg-black/20 rounded-full blur-xl transform translate-y-2 scale-110"></div>
          {/* Main node */}
          <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-full p-3 shadow-2xl border-4 border-white backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-emerald-500/20 rounded-full"></div>
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt="Profile"
                width={90}
                height={90}
                className="rounded-full object-cover relative z-10 shadow-lg"
              />
            ) : (
              <div className="w-[90px] h-[90px] rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-emerald-600 flex items-center justify-center shadow-lg relative z-10">
                <span className="text-2xl text-white font-bold drop-shadow-md">You</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company nodes with 3D floating effect */}
      {displayedCompanies.map((company, index) => {
        const angle = (index * 360) / displayedCompanies.length
        const radius = 32
        const x = 50 + radius * Math.cos((angle * Math.PI) / 180)
        const y = 50 + radius * Math.sin((angle * Math.PI) / 180)
        
        return (
          <div
            key={`company-${company._id}`}
            className="absolute transform-gpu transition-all duration-500 hover:scale-125 hover:-translate-y-2"
            style={{
              zIndex: 5,
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${index * 150}ms`
            }}
          >
            <div className="relative group">
              {/* Shadow */}
              <div className="absolute inset-0 bg-black/15 rounded-full blur-lg transform translate-y-1 scale-110 group-hover:scale-125 transition-all duration-500"></div>
              {/* Main company node */}
              <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-full p-2.5 shadow-xl border-2 border-white/80 backdrop-blur-sm group-hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-blue-400/10 to-purple-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {company.imageUrl ? (
                  <Image
                    src={company.imageUrl}
                    alt={company.alt || `Company ${company.company}`}
                    width={70}
                    height={70}
                    className="rounded-full object-cover relative z-10 shadow-md"
                  />
                ) : (
                  <div className="w-[70px] h-[70px] rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-md relative z-10">
                    <span className="text-2xl filter drop-shadow-sm">🏢</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
      
      {/* Center label with glass effect */}
      <div 
        className="absolute text-center"
        style={{ 
          zIndex: 2,
          left: '50%',
          top: 'calc(50% + 85px)',
          transform: 'translateX(-50%)'
        }}
      >
        <div className="bg-white/70 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-white/50">
          <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Your Opportunity Network</p>
        </div>
      </div>
    </div>
  )
}