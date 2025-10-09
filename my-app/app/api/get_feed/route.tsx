import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
  if (sessionError || !session) {
    console.log('Authentication failed:', sessionError?.message || 'No session');
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const userEmail = session?.user?.email;

  // Get feed items with author information, filtered by connections and audience rating
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
        profile_image_url,
        connections_new,
        pending_connections_new
      )
    `)

  if (error) {
    return NextResponse.json({
      error: 'Failed to fetch feed items',
      details: error.message,
    }, { status: 500 });
  }


  // First, get the current user's ID from the subscribers table
  const { data: currentUserData, error: currentUserError } = await supabase
    .from('subscribers')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (currentUserError || !currentUserData) {
    return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
  }

  const currentUserId = currentUserData.id;

  // Filter feeds based on connection rating and audience rating
  const filteredFeeds = data?.filter(feed => {
    const author = Array.isArray(feed.subscribers) ? feed.subscribers[0] : feed.subscribers;
    if (!author) return false;

    // Find the current user's connection in the author's connections
    const allConnections = [
      ...(author.connections_new || []),
      ...(author.pending_connections_new || [])
    ];

    const userConnection = allConnections.find(conn => conn.connect_id === currentUserId);
    
    // If no connection exists, only show public feeds (audience_rating = 1)
    if (!userConnection) {
      return feed.audience_rating === 1;
    }

    // Check if user's connection rating meets the feed's audience rating requirement
    return userConnection.rating >= feed.audience_rating;
  });

  // Get company data for feeds that reference companies
  const companyIds = filteredFeeds?.map(feed => feed.company_id).filter(Boolean) || [];
  let companiesData: Array<{
    company: number;
    alt: string;
    caption?: string;
    description?: string;
    imageUrl: string;
    location?: string;
    hiring_tags?: string[];
    partner: boolean;
  }> = [];
  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from('companies')
      .select('company, alt, caption, description, imageUrl, location, hiring_tags, partner')
      .in('company', companyIds);
    companiesData = companies || [];
  }

  // Get referenced feed data for feeds that reference other feeds
  const referencedFeedIds = filteredFeeds?.map(feed => feed.feed_id).filter(Boolean) || [];
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
  const formattedFeeds = filteredFeeds?.map(feed => {
    const author = Array.isArray(feed.subscribers) ? feed.subscribers[0] : feed.subscribers;
    
    // Find company data if this feed references a company
    const companyData = feed.company_id ? 
      companiesData.find(c => c.company === feed.company_id) : null;
    
    // Find referenced feed if this feed references another feed
    const referencedFeed = feed.feed_id ? 
      referencedFeeds.find(f => f.id === feed.feed_id) : null;
    const referencedAuthor = referencedFeed?.subscribers ? 
      (Array.isArray(referencedFeed.subscribers) ? referencedFeed.subscribers[0] : referencedFeed.subscribers) : null;

    return {
      id: feed.id,
      created_at: feed.created_at,
      subscriber_id: feed.subscriber_id,
      company_id: feed.company_id,
      feed_id: feed.feed_id,
      content: feed.content,
      audience_rating: feed.audience_rating,
      author_name: `${author.first_name} ${author.last_name}`.trim(),
      author_image: author.profile_image_url,
      // Repost data
      company_name: companyData?.alt || companyData?.caption,
      company_image: companyData?.imageUrl,
      company_data: companyData ? {
        _id: `company-${companyData.company}`,
        _rev: 'feed-generated',
        _type: 'company',
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        company: companyData.company,
        partner: companyData.partner || false,
        alt: companyData.alt,
        caption: companyData.caption,
        description: companyData.description,
        imageUrl: companyData.imageUrl,
        location: companyData.location,
        hiring_tags: companyData.hiring_tags
      } : undefined,
      referenced_feed_content: referencedFeed?.content,
      referenced_feed_author: referencedAuthor ? 
        `${referencedAuthor.first_name} ${referencedAuthor.last_name}`.trim() : undefined
    };
  });

  return NextResponse.json(formattedFeeds || []);
}

    