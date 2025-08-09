import { Navigation } from '@/app/components/header'
import { Container } from '@/app/components/container'
import { client } from '@/lib/sanity/client'
import { ArticleCards, ArticleCardPost } from '@/app/components/article_issues';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export default async function Bookmarks() {
    const POSTS_QUERY = `*[_type == "post" && defined(slug.current)]|order(publishedAt desc){_id, title, slug, company, publishedAt, image}`;
    const options = { next: { revalidate: 30 } };
    const posts = await client.fetch(POSTS_QUERY, {}, options);

    const cookieStore = cookies();

    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session?.user?.email;

    const { data, error: fetchError } = await supabase
        .from('subscribers')
        .select('bookmarked_companies')
        .eq('email', userEmail)
        .single()

    if (fetchError) {
        console.error('Bookmark update error:', fetchError);
        return NextResponse.json({ 
        error: 'Failed to bookmark', 
        details: fetchError.message 
        }, { status: 500 });
    }

    const bookmarks = data?.bookmarked_companies ?? [];

    const bookmarkedPosts = posts.filter(
        (post: ArticleCardPost) => bookmarks.includes(post.company)
    );


    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
            <Navigation />
            <div className="pt-12 pb-4 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
            <Container>
              <div className="bg-white rounded-2xl shadow-md border border-neutral-200 px-8 py-10 w-full sm:w-5/6 md:w-4/5 lg:w-3/4 xl:w-[70%] mx-auto">
                <h2 className="text-3xl font-semibold mb-8">Bookmarked Articles</h2>
                <ArticleCards posts={bookmarkedPosts} compact />
              </div>
            </Container>
            </div>
        </div>
    )
}