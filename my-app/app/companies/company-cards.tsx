'use client'

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CompanyData } from "@/app/types"
import ApplyButton from "@/app/components/apply"
import RainbowBookmark from "@/app/components/rainbow_bookmark"

type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null
}

interface CompanyCardsProps {
  companies: CompanyWithImageUrl[]
}

function CompanyCard({ company }: { company: CompanyWithImageUrl }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Company Header */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
            {company.imageUrl ? (
              <Image
                src={company.imageUrl}
                alt={company.alt || `Company ${company.company.toString()}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center text-neutral-600 font-bold text-lg">
                {company.alt ? company.alt.charAt(0).toUpperCase() : 'C'}
              </div>
            )}
          </div>

          {/* Company Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                  {company.alt || `Company ${company.company.toString()}`}
                </h3>
                {company.caption && (
                  <p className="text-sm text-neutral-600 mb-2">
                    {company.caption}
                  </p>
                )}
                {company.tags && company.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 text-neutral-700 rounded-full border border-neutral-200">
                      article published
                    </span>
                  </div>
                )}
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Rainbow Bookmark Button */}
                <RainbowBookmark company={company.company} />
                
                {/* Expand Button */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center justify-center w-8 h-8 hover:bg-neutral-100 transition-colors rounded-lg"
                >
                  {isExpanded ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-neutral-200 bg-neutral-50">
          <div className="p-6">
            {company.description && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-neutral-900 mb-2">About</h4>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {company.description}
                </p>
              </div>
            )}



            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {company.tags && company.tags.length > 0 && (
                <Link
                  href={`/${company.tags[0]}`}
                  className="inline-flex items-center justify-center bg-neutral-900 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-neutral-800 transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Read Article
                </Link>
              )}
              <div className="flex-1">
                <ApplyButton company={company.company.toString()} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CompanyCards({ companies }: CompanyCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {companies.map((company) => (
        <CompanyCard key={company._id} company={company} />
      ))}
    </div>
  )
}
