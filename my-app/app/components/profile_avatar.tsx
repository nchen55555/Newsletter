'use client'
import * as React from 'react'
import Image from 'next/image'
import { stringToGradient } from '@/lib/stringToGradient'
// Props:
// - name: used for gradient + initial
// - imageUrl: profile image URL (e.g., from Supabase Storage public/signed URL)
// - size: pixel size of the circle; defaults to 128
// - editable: show a small "Change" button that opens file picker
// - onSelectFile: callback when user picks a file (hook into your Supabase upload)
type Props = {
  name: string
  imageUrl?: string | null
  size?: number
  editable?: boolean
  onSelectFile?: (file: File) => void
  className?: string
}

export default function ProfileAvatar({
  name,
  imageUrl,
  size = 128,
  editable = false,
  onSelectFile,
  className = '',
}: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [localPreview, setLocalPreview] = React.useState<string | null>(null)

  const src = localPreview || imageUrl || ''

  function handleClick() {
    if (!editable) return
    inputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file size (10 MB = 10 * 1024 * 1024 bytes = 10,485,760 bytes)
    const maxSizeInBytes = 10 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      alert(`File size must be less than 10 MB. Your file is ${Math.round(file.size / (1024 * 1024))} MB.`)
      // Clear the input
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      return
    }
    
    // show instant local preview
    const preview = URL.createObjectURL(file)
    setLocalPreview(preview)
    onSelectFile?.(file)
  }

  const initial = (name && Array.from(name)[0]?.toUpperCase()) || '?'
  const gradient = stringToGradient(name)

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div
        className="relative rounded-full overflow-hidden ring-2 ring-gray-100"
        style={{
          width: size,
          height: size,
          backgroundImage: src ? undefined : gradient, // gradient when no image
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Real image overlay if we have one */}
        {src ? (
          <Image
            alt="Profile picture"
            src={src}
            width={size}
            height={size}
            className="object-cover w-full h-full"
          />
        ) : (
          // Letter placeholder (SVG scales cleanly)
          <svg className="w-full h-full" viewBox="0 0 60 60" role="img" aria-label={`Avatar ${initial}`}>
            <text
              x="50%"
              y="52%"
              textAnchor="middle"
              alignmentBaseline="middle"
              fontSize="28"
              fill="rgba(255,255,255,0.9)"
              style={{ fontWeight: 600, letterSpacing: '0.5px' }}
            >
              {initial}
            </text>
          </svg>
        )}

        {/* Hover edit affordance */}
        {editable && (
          <button
            type="button"
            onClick={handleClick}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity text-white text-sm"
            aria-label="Change profile picture"
          >
            Change
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
