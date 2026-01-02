import { ArticleNewsfeed } from "@/app/components/article_mosaic";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { ProtectedContent } from "@/app/components/protected-content";

export default function ArticlePage() {
    return (
        <SidebarLayout title="Articles">
            <div className={`max-w-6xl px-8 pt-2 pb-8`}>
              <ProtectedContent>
                <ArticleNewsfeed />
              </ProtectedContent>
            </div>
        </SidebarLayout>

    )
}