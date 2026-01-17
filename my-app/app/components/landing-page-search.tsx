'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { ProfileData, CompanyData } from '@/app/types'
import ProfileAvatar from './profile_avatar'
import { encodeSimple } from '@/app/utils/simple-hash'
import imageUrlBuilder from '@sanity/image-url';
import { SanityImageSource } from '@sanity/image-url/lib/types/types'
import { client } from '@/lib/sanity/client'

interface LandingPageSearchProps {
  isLandingPage?: boolean
  isSubscribed: boolean
  variant?: 'large' | 'compact'
  opportunities?: CompanyData[]
}

type SearchFilter = 'people' | 'opportunities'

export function LandingPageSearch({
  isLandingPage = false,
  isSubscribed,
  variant = 'large',
  opportunities = [],
}: LandingPageSearchProps) {
  const builder = imageUrlBuilder(client);


  function urlForImage(source: SanityImageSource) {
      return builder.image(source)
  }
  const router = useRouter()
  const [allProfiles, setAllProfiles] = useState<ProfileData[] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('people')

  // Fetch profiles for search
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await fetch('/api/get_cohort', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        setAllProfiles(data.profiles || null)
      } catch (e) {
        console.error('Failed to fetch cohort for search:', e)
      }
    }

    fetchProfiles()
  }, [])

  // Filter search results based on current filter
  const searchResults = searchFilter === 'people'
    ? (allProfiles || []).filter(profile => {
        const hasNames =
          profile.first_name &&
          profile.last_name &&
          profile.first_name.trim() !== '' &&
          profile.last_name.trim() !== ''

        if (!hasNames || !searchQuery) return false

        const fullName = `${profile.first_name} ${profile.last_name}`.toLowerCase()
        const query = searchQuery.toLowerCase()
        return fullName.includes(query)
      }).slice(0, 6)
    : []

  const opportunityResults = searchFilter === 'opportunities'
    ? opportunities.filter(company => {
        if (!searchQuery) return false
        const query = searchQuery.toLowerCase()
        return (
          company.alt?.toLowerCase().includes(query) ||
          company.caption?.toLowerCase().includes(query) ||
          company.description?.toLowerCase().includes(query)
        )
      }).slice(0, 6)
    : []

  const handleSearchResultClick = () => {
    setLoading(true)

    // If the user isn't authenticated/subscribed yet, route them through the login flow
    if (!isSubscribed) {
      router.push('/login')
      return
    }

    if (searchFilter === 'people' && selectedProfile) {
      const fullName = `${selectedProfile.first_name} ${selectedProfile.last_name}`
      setSearchQuery(fullName)
      setShowDropdown(false)
      router.push(`/people/${encodeSimple(selectedProfile.id)}`)
    } else if (searchFilter === 'opportunities' && selectedCompany) {
      setSearchQuery(selectedCompany.alt || '')
      setShowDropdown(false)
      router.push(`/companies/${selectedCompany.company}`)
    }
  }

  const isLarge = variant === 'large'

  if (isLandingPage) {
    return
  }
  

  return (

    <div className={`${isLarge ? 'mt-10 w-full max-w-5xl mx-auto' : 'flex-1 max-w-lg ml-8'} relative`}>
      <div className={`flex items-center bg-white dark:bg-neutral-800 ${isLarge ? 'gap-3' : 'gap-1.5'} ${isLarge ? 'rounded-2xl' : 'rounded-lg'} ${isLarge ? 'border border-neutral-300 dark:border-neutral-700 shadow-lg' : 'border border-neutral-300 dark:border-neutral-700'} ${isLarge ? 'px-5 py-3' : 'px-2 py-1'}`}>
        <Search className={`text-neutral-500 dark:text-neutral-400 ${isLarge ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />

        {/* Filter Toggle */}
        <div className={`inline-flex rounded-lg border border-neutral-200 dark:border-neutral-600 p-0.5 bg-neutral-100 dark:bg-neutral-700 ${isLarge ? '' : 'scale-75'}`}>
          <button
            type="button"
            onClick={() => {
              setSearchFilter('people')
              setSearchQuery('')
              setSelectedProfile(null)
              setSelectedCompany(null)
            }}
            className={`${isLarge ? 'h-8 px-3 text-sm' : 'h-6 px-2 text-xs'} rounded-md font-medium transition-all ${
              searchFilter === 'people'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            people
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchFilter('opportunities')
              setSearchQuery('')
              setSelectedProfile(null)
              setSelectedCompany(null)
            }}
            className={`${isLarge ? 'h-8 px-3 text-sm' : 'h-6 px-2 text-xs'} rounded-md font-medium transition-all ${
              searchFilter === 'opportunities'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            opportunities
          </button>
        </div>

        <Input
          type="text"
          placeholder={searchFilter === 'people'
            ? "who do you want to connect with to pave your career trajectory ..."
            : "what opportunities are out there ..."
          }
          value={searchQuery}
          onChange={(e) => {
            const value = e.target.value
            setSearchQuery(value)
            setShowDropdown(value.length > 0)
          }}
          onFocus={() => setShowDropdown(searchQuery.length > 0)}
          onBlur={() => {
            // Delay hiding to allow click on result
            setTimeout(() => setShowDropdown(false), 150)
          }}
          className={`flex-1 border-none bg-transparent dark:bg-transparent shadow-none ${isLarge ? 'h-12 text-xl' : 'h-6 text-xs'} text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none`}
        />

        <Button
          type="button"
          className={`${isLarge ? 'h-12 px-6 text-base rounded-xl' : 'h-8 px-4 text-sm rounded-lg'} bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200`}
          onClick={handleSearchResultClick}
          disabled={loading}
        >
          {loading ? 'searching...' : 'search'}
        </Button>
      </div>

      {/* People Results Dropdown */}
      {showDropdown && searchFilter === 'people' && searchResults.length > 0 && (
        <div className={`absolute top-full left-0 right-0 ${isLarge ? 'mt-3' : 'mt-1'} bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 ${isLarge ? 'rounded-lg' : 'rounded-md'} shadow-lg z-20 max-h-64 overflow-y-auto`}>
          {searchResults.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => {
                setSelectedProfile(profile)
                setSearchQuery(`${profile.first_name} ${profile.last_name}`)
                setShowDropdown(false)
              }}
              className={`w-full text-left flex items-center ${isLarge ? 'gap-3 p-3' : 'gap-1.5 p-1.5'} hover:bg-neutral-50 dark:hover:bg-neutral-700 border-b border-neutral-100 dark:border-neutral-700 last:border-b-0`}
            >
              <ProfileAvatar
                name={`${profile.first_name} ${profile.last_name}`}
                imageUrl={profile.profile_image_url || undefined}
                size={isLarge ? 32 : 24}
                editable={false}
                className={`${isLarge ? 'w-8 h-8' : 'w-6 h-6'} rounded-full flex-shrink-0`}
              />
              <div className="flex-1">
                <div className={`font-medium text-neutral-900 dark:text-neutral-100 ${isLarge ? '' : 'text-xs'}`}>
                  {profile.first_name} {profile.last_name}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Opportunities Results Dropdown */}
      {showDropdown && searchFilter === 'opportunities' && opportunityResults.length > 0 && (
        <div className={`absolute top-full left-0 right-0 ${isLarge ? 'mt-3' : 'mt-1'} bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 ${isLarge ? 'rounded-lg' : 'rounded-md'} shadow-lg z-20 max-h-64 overflow-y-auto`}>
          {opportunityResults.map((company) => {
            const imageUrl = company.image ? urlForImage(company.image)?.url() : null
            return (
              <button
                key={company._id}
                type="button"
                onClick={() => {
                  setSelectedCompany(company)
                  setSearchQuery(company.alt || '')
                  setShowDropdown(false)
                }}
                className={`w-full text-left flex items-center ${isLarge ? 'gap-3 p-3' : 'gap-1.5 p-1.5'} hover:bg-neutral-50 dark:hover:bg-neutral-700 border-b border-neutral-100 dark:border-neutral-700 last:border-b-0`}
              >
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={company.alt || 'Company'}
                    width={32}
                    height={32}
                    className={`${isLarge ? 'w-8 h-8' : 'w-6 h-6'} rounded object-cover flex-shrink-0`}
                  />
                )}
                <div className="flex-1">
                  <div className={`font-medium text-neutral-900 dark:text-neutral-100 ${isLarge ? '' : 'text-xs'}`}>
                    {company.alt}
                  </div>
                  {company.caption && (
                    <div className={`text-neutral-600 dark:text-neutral-400 ${isLarge ? 'text-sm' : 'text-xs'} line-clamp-1`}>
                      {company.caption}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
