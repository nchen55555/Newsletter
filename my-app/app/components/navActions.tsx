'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { GoogleLogin } from './google_login'
import Link from 'next/link'
import { Login } from './login'

export function NavActions() {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [loading, setLoading] = useState(true)

    const checkSubscription = () => {
        setLoading(true)
        return fetch('/api/subscription')
            .then(res => res.json())
            .then(data => {
                setIsSubscribed(data.isSubscribed)
                return data.isSubscribed
            })
            .catch(error => {
                console.error('Error checking subscription:', error)
                setIsSubscribed(false)
                return false
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        checkSubscription()
    }, [])

    const supabase = createClientComponentClient()

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error("Logout error:", error)
        } else {
            window.location.href = '/'
        }
    }
    return (
        <div>
        {!isSubscribed && !loading && (
           <Login />
        )}
        {isSubscribed && !loading && (
            <DropdownMenu>
                <DropdownMenuTrigger><Avatar className="cursor-pointer">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    {/* <AvatarFallback>NC</AvatarFallback> */}
                </Avatar> </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem><Link href="/profile">profile</Link></DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>logout</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )}
        </div>
    )
}