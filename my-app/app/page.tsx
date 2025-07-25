import { Navigation } from "./components/header";
import { Introduction } from "./components/introduction";
import { ArticleCards } from "./components/article_issues";
import { Container } from "./components/container";
import BlogTypingDemo from "./components/blog_typing_demo";

export default async function Home() {
  return ( 
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white"> 
      <Navigation />
      <div className="pt-12 pb-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
        <Container>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
            <div className="w-full lg:w-1/2 pr-0 lg:pr-8 mb-8 lg:mb-0 flex flex-col items-center lg:items-start">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight mb-6 md:mb-8 relative inline-block text-center lg:text-left">
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-neutral-950 via-neutral-800 to-neutral-600 animate-gradient">
                  the nic(h)e list
                </span>
                <span className="absolute inset-0 bg-yellow-200/50 -rotate-1 rounded-lg transform -skew-x-6" />
              </h1>
              <div className="w-full max-w-md">
                <Introduction />
              </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center">
              <div className="w-full max-w-xl rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 backdrop-blur-lg bg-white/90 border border-neutral-100/50 transition-all hover:shadow-2xl">
                <BlogTypingDemo />
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-4">
          <h2 className="text-2xl font-medium tracking-tight mb-8 relative inline-block">
            <span className="relative z-10">recent issues</span>
            <span className="absolute inset-0 bg-yellow-200/50 -rotate-1 rounded-lg transform -skew-x-6" />
          </h2>
          <ArticleCards />
        </div>
      </Container>
    </div>
  );
}
