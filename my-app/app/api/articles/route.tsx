// import { NextRequest, NextResponse } from 'next/server'

// export async function GET(req: NextRequest) {
//   try {
//     const query = `*[
//       _type == "post"
//       && defined(slug.current)
//     ]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt, image, excerpt}`

//     const url = `https://ti8yxeb5.api.sanity.io/v2024-01-01/data/query/production?query=${encodeURIComponent(query)}`
    
//     const res = await fetch(url)
//     const data = await res.json()
    
//     return NextResponse.json(data)
//   } catch (error) {
//     console.error('Error fetching articles:', error)
//     return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
//   }
// }
