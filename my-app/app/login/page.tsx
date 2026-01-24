import AccessClient from "../components/access_client";
import { ArticleNewsfeed } from "../components/article_mosaic";
import LandingClient from "@/app/components/landing_client";

export const dynamic = 'force-dynamic';

export default async function Login() {

    return (
      <>
        <AccessClient />
          {/* Shared article mosaic / combined feed */}
          <LandingClient />
          <ArticleNewsfeed limit={4} />
      </>
    );
  }
  
