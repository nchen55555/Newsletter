import { Container } from "@/app/components/container";
import { ArticleMosaic } from "@/app/components/article_mosaic";
import { Navigation } from "@/app/components/header";
import { ProtectedContent } from "@/app/components/protected-content";

export default function ArticlePage() {
    return (
        
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
            <Navigation />
            <Container>
              <ProtectedContent>
                <div className="pt-12 pb-16 relative">
                  <div className="pt-6">
                    <ArticleMosaic />
                  </div>
                </div>
              </ProtectedContent>
            </Container>
        </div>
    )
}