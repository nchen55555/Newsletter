"use client"

import { useState } from "react"
import { CompanyCard } from "@/app/companies/company-cards"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CompanyData } from "../opportunities/opportunities_fetch_information"
import { NetworkCompanies } from "../opportunities/opportunities_fetch_information"

type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null;
};

export default function CompanyCarousel({
  companies,
  network_connections,
  onFinishPerusing,
  onBookmarksChange,
}: {
  companies: CompanyWithImageUrl[]
  network_connections?: Map<number, NetworkCompanies>
  onFinishPerusing?: () => void
  onBookmarksChange?: (bookmarkedCompanies: number[]) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [bookmarkedCompanies, setBookmarkedCompanies] = useState<Set<number>>(new Set())
  const totalPages = companies.length

  // Handle bookmark changes
  const handleBookmarkChange = (companyId: number, isBookmarked: boolean) => {
    setBookmarkedCompanies(prev => {
      const newSet = new Set(prev);
      if (isBookmarked) {
        newSet.add(companyId);
      } else {
        newSet.delete(companyId);
      }

      // Notify parent component of bookmark changes
      const bookmarksArray = Array.from(newSet);
      onBookmarksChange?.(bookmarksArray);

      return newSet;
    });
  }

  const hasBookmarks = bookmarkedCompanies.size > 0

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const currentCompany = companies[currentIndex]

  const currentNetworkConnections = network_connections?.get(currentCompany.company)

  return (
    <div className="relative max-w-md mx-auto">
      {/* Carousel Container */}
      <div className="overflow-hidden rounded-lg">
        <CompanyCard
          appliedToNiche={false}
          key={currentCompany._id}
          company={currentCompany}
          external={!currentCompany.partner}
          network_connections={currentNetworkConnections}
          onBookmarkChange={handleBookmarkChange}
        />
      </div>

      {/* Navigation Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevSlide}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 10) }).map((_, index) => {
              const pageIndex = totalPages > 10 ? 
                Math.max(0, Math.min(currentIndex - 5, totalPages - 10)) + index :
                index;
              return (
                <button
                  key={pageIndex}
                  onClick={() => setCurrentIndex(pageIndex)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    pageIndex === currentIndex ? 'bg-neutral-900' : 'bg-neutral-300'
                  }`}
                />
              );
            })}
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={nextSlide}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Finish Perusing Button */}
      {onFinishPerusing && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={onFinishPerusing}
            disabled={!hasBookmarks}
            size="lg"
            className="w-full max-w-xs"
          >
            Finish Perusing
          </Button>
        </div>
      )}
    </div>
  )
}
    