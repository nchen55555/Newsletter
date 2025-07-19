import { Navigation } from "@/app/components/header";
import { Container } from "@/app/components/container";
import { ArticleMosaic } from "@/app/components/article_mosaic";

export default async function ArticlePage() {
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
            <Navigation />
            <Container>
            <div className="pt-12 pb-16 relative">
                <h1 className="text-6xl font-medium tracking-tight mb-8 relative inline-block">
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-neutral-950 via-neutral-800 to-neutral-600 animate-gradient">
                  the nic(h)e list
                </span>
                <span className="absolute inset-0 bg-yellow-200/50 -rotate-1 rounded-lg transform -skew-x-6" />
              </h1>
                <div className="pt-12">
                    <ArticleMosaic />
                </div>
                </div>
            </Container>
        </div>
    )
};
    