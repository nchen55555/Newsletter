import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Validate URL
    new URL(url);
    
    // Fetch the HTML content to extract Open Graph image
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
    }
    
    const html = await response.text();
    
    // Extract Open Graph image
    const ogImageMatch = html.match(/<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i);
    let imageUrl = ogImageMatch ? ogImageMatch[1] : null;
    
    // If no og:image, try twitter:image
    if (!imageUrl) {
      const twitterImageMatch = html.match(/<meta[^>]*name=["\']twitter:image["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i);
      imageUrl = twitterImageMatch ? twitterImageMatch[1] : null;
    }
    
    // If no social images, try to find the first image in the page
    if (!imageUrl) {
      const imgMatch = html.match(/<img[^>]*src=["\']([^"\']*)["\'][^>]*>/i);
      imageUrl = imgMatch ? imgMatch[1] : null;
    }
    
    if (imageUrl) {
      // Handle relative URLs
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      } else if (!imageUrl.startsWith('http')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}/${imageUrl}`;
      }
      
      return NextResponse.json({ imageUrl });
    } else {
      return NextResponse.json({ error: 'No thumbnail found' }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Thumbnail extraction failed:', error);
    return NextResponse.json({ error: 'Failed to extract thumbnail' }, { status: 500 });
  }
}