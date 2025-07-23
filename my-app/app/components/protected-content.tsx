'use client'

import { useEffect, useState } from "react"
import { Navigation } from "./header"
import { Container } from "./container"
import { Skeleton } from "@/components/ui/skeleton"
import { useSubscriptionContext } from "./subscription_context"

export function ProtectedContent({ children }: { children: React.ReactNode }) {
    const { isSubscribed } = useSubscriptionContext();
    // const [loading, setLoading] = useState(true)
    // const [email, setEmail] = useState<string | null>(null)

    // useEffect(() => {
    //     setLoading(true)
    //     fetch('/api/subscription')
    //         .then(res => res.json())
    //         .then(data => {
    //             setIsSubscribed(data.isSubscribed)
    //             setEmail(data.email)
    //         })
    //         .catch(error => {
    //             console.error('Error checking subscription:', error)
    //             setIsSubscribed(false)
    //             setEmail(null)
    //         })
    //         .finally(() => setLoading(false))
    // }, [])
    // console.log("Are we subscribed?", isSubscribed)

    const LoadingSkeleton = () => (
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
            <Navigation />
            <Container>
                <div className="pt-12 pb-16 relative">
                    <div className="pt-12">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    )

    if (!isSubscribed) {
        window.location.href = '/access'
        return <LoadingSkeleton />
    }

    return <>{children}</>
}
