import { ArticleNewsfeed } from "@/app/components/article_mosaic";
import { Navigation } from "@/app/components/header";
import { ProtectedContent } from "@/app/components/protected-content";

export default function ArticlePage() {
    return (
        <div className="min-h-screen" style={{
          background: `
            radial-gradient(ellipse 700px 500px at 85% 15%, rgba(34, 197, 94, 0.3) 0%, rgba(124, 211, 87, 0.25) 15%, rgba(253, 224, 71, 0.3) 35%, rgba(253, 224, 71, 0.2) 60%, rgba(255, 255, 255, 0.8) 80%, rgba(255, 255, 255, 1) 100%),
            white
          `
        }}>
            <Navigation />
            <div className="py-12">
              <ProtectedContent>
                <ArticleNewsfeed />
              </ProtectedContent>
            </div>
        </div>
    )
}