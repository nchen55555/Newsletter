'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Login } from './login'
import { useSubscriptionContext } from './subscription_context'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { stringToGradient } from '@/lib/stringToGradient' // <<— same helper as ProfileAvatar

// Match ProfileAvatar's initial logic: first character or '?'
function getProfileAvatarInitial(name: string) {
  return (name && Array.from(name)[0]?.toUpperCase()) || '?'
}

export function NavActions() {
  const { isSubscribed, loading } = useSubscriptionContext()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('')

  useEffect(() => {
    (async () => {
      if (loading || !isSubscribed) return

      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return

      const { data: row, error: dbErr } = await supabase
        .from('subscribers')
        .select('first_name, last_name, email, profile_image_url')
        .eq('email', user.email)
        .single()

      if (!dbErr && row) {
        setAvatarUrl(row.profile_image_url || null)
        const name = [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email || ''
        setDisplayName(name)
      }
    })()
  }, [isSubscribed, loading, supabase])

  const initial = useMemo(() => getProfileAvatarInitial(displayName), [displayName])
  const fallbackStyle = useMemo(() => ({
    backgroundImage: stringToGradient(displayName || 'User'),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }), [displayName])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Logout error:', error)
    else router.push('/')
  }

  if (loading) return <Skeleton className="h-12 w-full" />

  return (
    <div>
      {!isSubscribed && <Login />}
      {isSubscribed && (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="cursor-pointer">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile picture" className="object-cover w-full h-full" />}
              <AvatarFallback
                className="text-white font-semibold"
                style={fallbackStyle}
              >
                {initial}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><Link href="/profile">profile</Link></DropdownMenuItem>
            {/* <DropdownMenuItem><Link href="/ats">ats</Link></DropdownMenuItem> */}
            {/* <DropdownMenuItem><Link href="/bookmarks">bookmarks</Link></DropdownMenuItem> */}
            <DropdownMenuItem><Link href="/ats">applications</Link></DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
