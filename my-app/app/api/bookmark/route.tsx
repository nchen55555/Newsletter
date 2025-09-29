import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const { company , action } = await req.json();
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
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

    let updatedBookmarks;
    if (action === "add") {
        updatedBookmarks = bookmarks.includes(company)
        ? bookmarks
        : [...bookmarks, company];
    } else if (action === "remove") {
        updatedBookmarks = bookmarks.filter((c: number) => c !== company);
    }

    const { error: updateError } = await supabase
      .from('subscribers')
      .update({ bookmarked_companies: updatedBookmarks })
      .eq('email', userEmail);

    if (updateError) {
      console.error('Bookmark update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to bookmark', 
        details: updateError.message 
      }, { status: 500 });
    }

    // const { data: companyData, error: userFetchError } = await supabase
    //   .from('companies')
    //   .select('user_bookmarks')
    //   .eq('id', company)
    //   .single()

    // if (userFetchError) {
    //   console.error('Bookmark update to companies error:', userFetchError);
    //   return NextResponse.json({ 
    //     error: 'Failed to bookmark', 
    //     details: userFetchError.message 
    //   }, { status: 500 });
    // }

    // const userBookmarks = companyData?.user_bookmarks ?? [];

    // let userUpdatedBookmarks;
    // if (action === "add") {
    //     userUpdatedBookmarks = userBookmarks.includes(company)
    //     ? userBookmarks
    //     : [...userBookmarks, company];
    // } else if (action === "remove") {
    //     userUpdatedBookmarks = userBookmarks.filter((c: number) => c !== company);
    // }

    // const { error: userUpdateError } = await supabase
    //   .from('companies')
    //   .update({ user_bookmarks: userUpdatedBookmarks })
    //   .eq('id', company);

    // if (userUpdateError) {
    //   console.error('Bookmark update error:', updateError);
    //   return NextResponse.json({ 
    //     error: 'Failed to bookmark', 
    //     details: userUpdateError.message 
    //   }, { status: 500 });
    // }

    return NextResponse.json({ success: true, bookmarks: updatedBookmarks });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}