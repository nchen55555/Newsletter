import { ArticleNewsfeed } from "@/app/components/article_mosaic";
import { Navigation } from "@/app/components/header";
import { ProtectedContent } from "@/app/components/protected-content";

export default function ArticlePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
            <Navigation />
            <div className="py-12">
              <ProtectedContent>
                <ArticleNewsfeed />
              </ProtectedContent>
            </div>
        </div>
    )
}