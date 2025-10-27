import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
import { client } from '@/lib/sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { CompanyData } from '@/app/types';
import { createFilteredCompaniesQuery, CACHE_OPTIONS } from '@/lib/sanity/queries';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Get user_id from query parameters
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  
  if (!userId) {
    return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 });
  }

  // Get feed items for the specific user
  const { data, error } = await supabase
    .from('feed')
    .select(`
      id,
      created_at,
      subscriber_id,
      company_id,
      feed_id,
      content,
      audience_rating,
      subscribers!inner (
        id,
        first_name,
        last_name,
        profile_image_url
      )
    `)
    .eq('subscriber_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({
      error: 'Failed to fetch user threads',
      details: error.message,
    }, { status: 500 });
  }

  // Get company data for threads that reference companies using Sanity
  const companyIds = data?.map(thread => thread.company_id).filter(Boolean) || [];
  let companiesData: Array<CompanyData & { imageUrl: string | null }> = [];
  if (companyIds.length > 0) {
    const builder = imageUrlBuilder(client);
    const rawCompanies = await client.fetch(createFilteredCompaniesQuery(companyIds), {}, CACHE_OPTIONS.COMPANIES);
    
    companiesData = rawCompanies.map((company: CompanyData) => ({
      ...company,
      imageUrl: company.image ? builder.image(company.image).width(300).height(200).url() : null
    }));
  }

  // Get referenced feed data for threads that reference other feeds
  const referencedFeedIds = data?.map(thread => thread.feed_id).filter(Boolean) || [];
  let referencedFeeds: Array<{
    id: string;
    content: string;
    subscriber_id: number;
    subscribers: {
      first_name: string;
      last_name: string;
    } | Array<{
      first_name: string;
      last_name: string;
    }>;
  }> = [];
  if (referencedFeedIds.length > 0) {
    const { data: refFeeds } = await supabase
      .from('feed')
      .select(`
        id,
        content,
        subscriber_id,
        subscribers!inner (
          first_name,
          last_name
        )
      `)
      .in('id', referencedFeedIds);
    referencedFeeds = refFeeds || [];
  }

  // Format the response with complete information
  const formattedThreads = data?.map(thread => {
    const author = Array.isArray(thread.subscribers) ? thread.subscribers[0] : thread.subscribers;
    
    // Find company data if this thread references a company
    const companyData = thread.company_id ? 
      companiesData.find(c => c.company === thread.company_id) : null;
    
    // Find referenced feed if this thread references another feed
    const referencedFeed = thread.feed_id ? 
      referencedFeeds.find(f => f.id === thread.feed_id) : null;
    const referencedAuthor = referencedFeed?.subscribers ? 
      (Array.isArray(referencedFeed.subscribers) ? referencedFeed.subscribers[0] : referencedFeed.subscribers) : null;

    return {
      id: thread.id,
      created_at: thread.created_at,
      subscriber_id: thread.subscriber_id,
      company_id: thread.company_id,
      feed_id: thread.feed_id,
      content: thread.content,
      audience_rating: thread.audience_rating,
      author_name: `${author.first_name} ${author.last_name}`.trim(),
      author_image: author.profile_image_url,
      // Company data
      company_name: companyData?.alt || companyData?.caption,
      company_image: companyData?.imageUrl,
      company_data: companyData || undefined,
      referenced_feed_content: referencedFeed?.content,
      referenced_feed_author: referencedAuthor ? 
        `${referencedAuthor.first_name} ${referencedAuthor.last_name}`.trim() : undefined
    };
  });

  return NextResponse.json(formattedThreads || []);
}