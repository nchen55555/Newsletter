import { Navigation } from '@/app/components/header'
import { Container } from '@/app/components/container'
import { client } from '@/lib/sanity/client'
import CompanyCards from '@/app/companies/company-cards';
import { CompanyWithImageUrl, CompanyData } from '@/app/types';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import imageUrlBuilder from "@sanity/image-url";

export default async function Bookmarks() {
    // Query companies from mediaLibrary instead of posts
    const COMPANIES_QUERY = `*[
        _type == "mediaLibrary"
      ]{
        _id,
        company,
        image,
        publishedAt,
        alt,
        caption,
        description,
        tags
      }`;
    const options = { next: { revalidate: 30 } };
    const companies = await client.fetch(COMPANIES_QUERY, {}, options);

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

    // Filter companies by bookmarked company IDs
    const bookmarkedCompanies = companies.filter(
        (company: CompanyData) => bookmarks.includes(company.company)
    );

    // Build image URLs for bookmarked companies (same logic as companies page)
    const builder = imageUrlBuilder(client);
    const companiesWithImageUrls: CompanyWithImageUrl[] = bookmarkedCompanies.map((company: CompanyData) => ({
        ...company,
        imageUrl: company.image ? builder.image(company.image).url() : null
    }));


    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
            <Navigation />
            <div className="pt-12 pb-4 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
            <Container>
              <div className="px-8 py-10">
                <h2 className="text-3xl font-semibold mb-8 text-center">Bookmarked Profiles</h2>
                {companiesWithImageUrls.length > 0 ? (
                  <CompanyCards priority={[]} bookmarks={companiesWithImageUrls} other={[]} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-600">No bookmarked companies yet. Visit the companies page to bookmark some profiles!</p>
                  </div>
                )}
              </div>
            </Container>
            </div>
        </div>
    )
}