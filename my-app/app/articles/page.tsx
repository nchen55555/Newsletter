import { Container } from "@/app/components/container";
import { ArticleMosaic } from "@/app/components/article_mosaic";
import { Navigation } from "@/app/components/header";
import { ProtectedContent } from "@/app/components/protected-content";

export default function ArticlePage() {
    return (
        <ProtectedContent>
            <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
                <Navigation />
                <Container>
                    <div className="pt-12 pb-16 relative">
                        {/* <h1 className="text-6xl font-medium tracking-tight mb-8 relative inline-block">
                            <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-neutral-950 via-neutral-800 to-neutral-600 animate-gradient">
                                the nic(h)e list
                            </span>
                            <span className="absolute inset-0 bg-yellow-200/50 -rotate-1 rounded-lg transform -skew-x-6" />
                        </h1> */}
                        <p className="text-neutral-600 mb-6"> <strong>welcome to the niche</strong></p> 
                        <p className="text-neutral-600 mb-6"> you&#39;ve officially taken the first step in joining this exclusive cohort of students that we&#39;ve chosen to launch the niche, hand-picked from academic and industry recommendations </p> 
                        <p className="text-neutral-600 mb-6"><strong>we start with a simple question</strong></p> 
                        <p className="text-neutral-600 mb-6">why does it feel that even though entrepreneurship interest is skyrocketing, it&#39;s still so hard for the top students to discover, understand, and involve in the best startups? in fact, it seems like we are always a step late from interning at the next <a href="https://cursor.com/en" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Cursor</a> (would&#39;ve been such a win to know about the company back in 2022)</p> 
                        <p className="text-neutral-600 mb-6"><strong>well... one more question</strong></p> 
                        <p className="text-neutral-600 mb-6">and even if you identify an interesting startup, why is it so difficult to actually understand what they do and bet on their trajectory? landing pages are increasingly ambiguous, filled w/ VC buzz words and AI-generated content...</p>
                        <p className="text-neutral-600 mb-6"> <strong>that is what the niche is here to solve</strong></p> 
                        <h2 className="text-2xl font-medium tracking-tight mb-8 mt-8 relative inline-block">
                            <span className="relative z-10">recent issues</span>
                            <span className="absolute inset-0 bg-yellow-200/50 -rotate-1 rounded-lg transform -skew-x-6" />
                        </h2>
                        <div className="pt-6">
                            <ArticleMosaic />
                        </div>
                    </div>
                </Container>
            </div>
        </ProtectedContent>
    )
}