'use client'
import { Navigation } from "./header"
import { Container } from "./container"
import { Skeleton } from "@/components/ui/skeleton"
import { useSubscriptionContext } from "./subscription_context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function ProtectedContent({ children }: { children: React.ReactNode }) {
    const { isSubscribed, loading } = useSubscriptionContext();
    const router = useRouter();
    
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

    useEffect(() => {
        if (!loading && !isSubscribed) {
            router.push('/access');
        }
    }, [isSubscribed, router]);
    
    if (!isSubscribed || loading) {
        return <LoadingSkeleton />;
    }

    return <>{children}</>
}
