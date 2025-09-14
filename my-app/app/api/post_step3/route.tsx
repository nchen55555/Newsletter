import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Step3UpdateData } from '@/app/types';

export async function POST(req: NextRequest) {
  // Await cookies() before using
  const cookieStore = cookies();

  try {
    // 1. Create Supabase client using route handler with awaited cookies
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 2. Authenticate the user (use await)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 3. Parse JSON body
    const body = await req.json();
    const { 
      interests, 
      interestedCompanies, 
      networkRecommendations 
    } = body;

    console.log("fields ", interests, interestedCompanies, networkRecommendations)


    // 5. Prepare update data - only include fields that have values
    const updateData: Step3UpdateData = {};
    
    if (interests && interests.trim()) {
      updateData.interests = interests.trim();
    }
    
    if (interestedCompanies && interestedCompanies.trim()) {
      updateData.interested_companies = interestedCompanies.trim();
    }
  
    
    if (networkRecommendations && Array.isArray(networkRecommendations)) {
      // Filter out empty recommendations
      const validRecommendations = networkRecommendations.filter(rec => 
        rec && rec.name && rec.name.trim() && rec.email && rec.email.trim()
      );
      if (validRecommendations.length > 0) {
        updateData.network_recommendations = validRecommendations;
      }
    }

    // Only proceed with update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No fields to update' 
      });
    }

    // 6. Update subscriber profile with step 3 data
    const { error: dbError } = await supabase
      .from('subscribers')
      .update(updateData)
      .eq('email', user.email);

    if (dbError) {
      console.error('Step 3 update error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to update step 3 profile data', 
        details: dbError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Step 3 profile data updated successfully',
      updatedFields: Object.keys(updateData)
    });

  } catch (error) {
    console.error('Unexpected error in post_step3:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}