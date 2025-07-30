import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function PATCH(req: NextRequest) {
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

    // 3. Parse form data
    const formData = await req.formData();
    const requiredFields = [
      'first_name', 'last_name', 'linkedin_url', 
      'resume_file', 'phone_number', 'id', 'email'
    ];

    // Validate all required fields
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const resume_file = formData.get('resume_file');
    if (!(resume_file instanceof File)) {
      return NextResponse.json({ error: 'Resume file is invalid' }, { status: 400 });
    }

    // 4. Generate a secure file name
    const fileName = `${user.id}/resume-${Date.now()}-${resume_file.name}`;


    // Enhanced upload logging
    const { error: uploadError } = await supabase.storage
    .from('resume_files')
    .upload(fileName, resume_file, {
      contentType: resume_file.type,
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadError) {
      console.error('Full Upload Error:', {
        message: uploadError.message,
        details: uploadError
      });
      return NextResponse.json({ 
        error: 'Failed to upload resume', 
        details: uploadError.message 
      }, { status: 500 });
    }

    // 6. Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('resume_files')
      .getPublicUrl(fileName);

    // 7. Update subscriber profile
    const { error: dbError } = await supabase
      .from('subscribers')
      .update({
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        linkedin_url: formData.get('linkedin_url'),
        personal_website: formData.get('personal_website'),
        phone_number: formData.get('phone_number'),
        resume_url: publicUrl,
      })
      .eq('id', Number(formData.get('id')))
      .eq('email', formData.get('email'));

    if (dbError) {
      console.error('Profile update error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to update profile', 
        details: dbError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, resumeUrl: publicUrl });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}