'use client'

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CompanyData } from "./page"

type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null
}

interface CompanyTableProps {
  companies: CompanyWithImageUrl[]
}

function CompanyRow({ 
  company, 
  isExpanded, 
  onToggle 
}: { 
  company: CompanyWithImageUrl
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      {/* Main Row */}
      <tr className={`border-b border-neutral-200 transition-colors ${
        isExpanded 
          ? 'bg-neutral-50' 
          : 'hover:bg-neutral-50'
      }`}>
        <td className="px-3 md:px-4 py-3 md:py-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-base md:text-lg font-medium text-neutral-800">{company.alt || `Company ${company.company.toString()}`}</span>
              {company.tags && company.tags.length > 0 && (
                <span className="inline-block px-2 md:px-3 py-1 text-xs font-medium bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 text-neutral-700 rounded-full border border-neutral-200">
                  article published
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 md:gap-8">
              {company.caption && (
                <span className="text-sm md:text-base text-neutral-600 hidden sm:block">
                  {company.caption}
                </span>
              )}
              <button
                onClick={onToggle}
                className="flex items-center justify-center w-8 h-8 hover:bg-black/5 transition-colors ml-2 md:ml-4 rounded"
              >
                {isExpanded ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </td>
      </tr>
      
      {/* Expanded Content */}
      {isExpanded && (
        <tr className="bg-neutral-50">
          <td colSpan={1} className="px-3 md:px-4 py-4 md:py-6">
            <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
              {/* Company Logo */}
              <div className="w-full lg:w-1/3">
                {company.imageUrl && (
                  <div className="rounded-lg overflow-hidden">
                    <Image
                      src={company.imageUrl}
                      alt={company.alt || `Company ${company.company.toString()}`}
                      width={300}
                      height={200}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}
              </div>
              
              {/* Right: Description and Details */}
              <div className="w-full lg:w-2/3 space-y-4 md:space-y-6">
                <div>
                  <p className="text-base md:text-lg text-neutral-600 leading-relaxed mb-4 md:mb-6">
                    {company.description}
                  </p>
                  
                  {/* Visit Profile Link or Coming Soon */}
                  <div className="mb-4 md:mb-6">
                    {company.tags && company.tags.length > 0 ? (
                      <Link 
                        href={`/${company.tags[0]}`}
                        className="inline-flex items-center gap-2 text-base md:text-lg font-medium text-neutral-800 hover:text-neutral-600 transition-colors underline"
                      >
                        Visit Profile
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    ) : (
                      <span className="text-base md:text-lg font-medium text-neutral-500 italic">
                        Article coming soon
                      </span>
                    )}
                  </div>
                  
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function CompanyTable({ companies }: CompanyTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleExpanded = (companyId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(companyId)) {
        newSet.delete(companyId)
      } else {
        newSet.add(companyId)
      }
      return newSet
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
      <table className="w-full">
        <tbody>
          {companies.map((company) => (
            <CompanyRow 
              key={company._id} 
              company={company} 
              isExpanded={expandedRows.has(company._id)}
              onToggle={() => toggleExpanded(company._id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
