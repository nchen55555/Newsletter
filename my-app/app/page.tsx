import { ArticleNewsfeed } from "@/app/components/article_mosaic";
import LandingClient from "./components/landing_client";

export default async function Home() {

  return (
    <LandingClient>
      <div className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4">
            Network-Driven Warm Introductions
            </h1>
          <p className="text-base md:text-lg text-neutral-200 leading-relaxed">
            We want to reimagine hiring. The best hires happen through trusted introductions, not job boards. That&apos;s why we&apos;ve partnered with companies that value network-driven hiring. If your network signals a strong fit to one of our partner startups, we can facilitate a warm introduction to the founders for you on your behalf. Browse their stories below to deep dive into some of our partner stories. 
          </p>
        </div>
        <ArticleNewsfeed limit={6} />
    </LandingClient>
  );
}
