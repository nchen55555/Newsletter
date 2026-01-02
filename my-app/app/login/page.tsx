import { client } from "@/lib/sanity/client";
import AccessClient from "../components/access_client";
import { ArticleNewsfeed } from "../components/article_mosaic";
import LandingClient from "@/app/components/landing_client";

export default async function Login() {
    // Fetch posts from Sanity but use static mediaLibrary for companies 6 & 7
    const POSTS_QUERY = `*[_type == "post" 
    && defined(slug.current)
    && !(slug.current match "*-beta*")
    ]|order(publishedAt desc){_id, title, slug, publishedAt, image}`;
    
    const options = { next: { revalidate: 300 } };
    
    let posts = [];
    
    try {
      posts = await client.fetch(POSTS_QUERY, {}, options);
    } catch {
      posts = [];
    }

    return (
      <>
        <AccessClient />
          {/* Shared article mosaic / combined feed */}
          <LandingClient />
          <ArticleNewsfeed limit={4} />
      </>
    );
  }
  
