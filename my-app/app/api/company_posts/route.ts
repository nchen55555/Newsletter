import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity/client'
import { COMPANY_POST_QUERY, CACHE_OPTIONS } from '@/lib/sanity/queries'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyIdStr = searchParams.get('company_id')
    
    if (!companyIdStr) {
      return NextResponse.json(null)
    }
    
    const companyId = parseInt(companyIdStr)
    
    const postData = await client.fetch(COMPANY_POST_QUERY, { companyId }, CACHE_OPTIONS.ARTICLES);
    
    return NextResponse.json(postData, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=450' // Cache for 15 min, revalidate in background for 7.5 min
      }
    })
  } catch (error) {
    console.error('Error fetching company posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company posts' },
      { status: 500 }
    )
  }
}