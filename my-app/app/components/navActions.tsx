'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Login } from './login'
import { useSubscriptionContext } from './subscription_context'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export function NavActions() {
    const { isSubscribed, loading } = useSubscriptionContext();
    const router = useRouter();

    const supabase = createClientComponentClient()

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error("Logout error:", error)
        } else {
            router.push('/')
        }
    }
    if (loading) {
        return <Skeleton className="h-12 w-full" />; // or customize size
      }
    return (
        <div>
        {!isSubscribed && (
           <Login />
        )}
        {isSubscribed &&  (
            <DropdownMenu>
                <DropdownMenuTrigger><Avatar className="cursor-pointer">
                    <AvatarImage src="https://robohash.org/b0d01379a58b0ce340795fb04211a2fb?set=set4&bgset=&size=400x400" />
                    {/* <AvatarFallback>NC</AvatarFallback> */}
                </Avatar> </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem><Link href="/profile">profile</Link></DropdownMenuItem>
                    <DropdownMenuItem><Link href="/bookmarks">bookmarks</Link></DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>logout</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )}
        </div>
    )
}