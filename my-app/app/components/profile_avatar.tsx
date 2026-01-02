'use client'
import * as React from 'react'
import Image from 'next/image'
import { stringToGradient } from '@/lib/stringToGradient'
// Props:
// - name: used for gradient + initial
// - imageUrl: profile image URL (e.g., from Supabase Storage public/signed URL)
// - size: pixel size of the avatar; defaults to 128
// - shape: 'circle' or 'square'; defaults to 'circle'
// - editable: show a small "Change" button that opens file picker
// - onSelectFile: callback when user picks a file (hook into your Supabase upload)
type Props = {
  name: string
  imageUrl?: string | null
  size?: number
  shape?: 'circle' | 'square'
  editable?: boolean
  onSelectFile?: (file: File) => void
  className?: string
}

export default function ProfileAvatar({
  name,
  imageUrl,
  size = 128,
  shape = 'circle',
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

    
    // show instant local preview
    const preview = URL.createObjectURL(file)
    setLocalPreview(preview)
    onSelectFile?.(file)
  }

  const initial = (name && Array.from(name)[0]?.toUpperCase()) || '?'
  const gradient = stringToGradient(name)

  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-t-2xl'

  // If className includes sizing classes, apply them to the avatar div itself
  const hasCustomSize = className.includes('w-full') || className.includes('h-full') || className.includes('w-')
  const sizeStyle = hasCustomSize ? {} : { width: size, height: size }

  const avatarDiv = (
    <div
      className={`relative ${roundedClass} overflow-hidden ring-2 ring-gray-100 ${hasCustomSize ? className : ''}`}
      style={{
        ...sizeStyle,
        backgroundImage: src ? undefined : gradient, // gradient when no image
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
        {/* Real image overlay if we have one */}
        {src ? (
          hasCustomSize ? (
            <Image
              alt="Profile picture"
              src={src}
              fill
              className="object-cover"
            />
          ) : (
            <Image
              alt="Profile picture"
              src={src}
              width={size}
              height={size}
              className="object-cover w-full h-full"
            />
          )
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
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity text-white text-sm z-10"
          aria-label="Change profile picture"
        >
          Change
        </button>
      )}

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

  return hasCustomSize ? avatarDiv : (
    <div className="inline-flex flex-col items-center">
      {avatarDiv}
    </div>
  )
}
