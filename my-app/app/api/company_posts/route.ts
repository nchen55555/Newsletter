import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyIdStr = searchParams.get('company_id')
    
    if (!companyIdStr) {
      return NextResponse.json(null)
    }
    
    const companyId = parseInt(companyIdStr)
    
    // Use the same query pattern as companies/[id]/page.tsx
    const COMPANY_POST_QUERY = `*[_type == "post" && company == $companyId][0]`;
    
    const postData = await client.fetch(COMPANY_POST_QUERY, { companyId });
    
    return NextResponse.json(postData)
  } catch (error) {
    console.error('Error fetching company posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company posts' },
      { status: 500 }
    )
  }
}