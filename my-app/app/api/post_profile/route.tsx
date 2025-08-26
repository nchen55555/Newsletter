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
      'resume_file', 'phone_number', 'id', 'email', 'bio', 'profile_image'
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


    const profile_image_file = formData.get('profile_image');
    if (profile_image_file && !(profile_image_file instanceof File)) {
      return NextResponse.json({ error: 'Profile image file is invalid' }, { status: 400 });
    }

    const transcript_file = formData.get('transcript_file');
    if (!(transcript_file instanceof File)) {
      return NextResponse.json({ error: 'Transcript file is invalid' }, { status: 400 });
    }


    // 4. Generate a secure file name
    const fileName = `${user.id}/resume.pdf`;
    let profile_image_url: string | null = null;


    // Enhanced upload logging
    const { error: uploadError } = await supabase.storage
    .from('resume_files')
    .upload(fileName, resume_file, {
      contentType: resume_file.type,
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadError) {
      console.error('Resume Upload Error:', {
        message: uploadError.message,
        details: uploadError
      });
      return NextResponse.json({ 
        error: 'Failed to upload resume', 
        details: uploadError.message 
      }, { status: 500 });
    }

    const transcriptFileName = `${user.id}/transcript.pdf`;
    const { error: transcriptUploadError } = await supabase.storage
    .from('transcript_files')
    .upload(transcriptFileName, transcript_file, {
      contentType: transcript_file.type,
      cacheControl: '3600',
      upsert: true,
    });

    if (transcriptUploadError) {
      console.error('Transcript Upload Error:', {
        message: transcriptUploadError.message,
        details: transcriptUploadError
      });
      return NextResponse.json({ 
        error: 'Failed to upload transcript', 
        details: transcriptUploadError.message 
      }, { status: 500 });
    }


    if (profile_image_file){

      const profile_image_file_name = `${user.id}/profile_image.jpg`;


      const { error: profile_image_uploadError } = await supabase.storage
      .from('profile_image_files')
      .upload(profile_image_file_name, (profile_image_file as File), {
        contentType: (profile_image_file as File).type,
        cacheControl: '3600',
        upsert: true,
      });


      if (profile_image_uploadError) {
        console.error('Profile Image Upload Error:', {
          message: profile_image_uploadError.message,
          details: profile_image_uploadError
        });
        return NextResponse.json({ 
          error: 'Failed to upload profile image', 
          details: profile_image_uploadError.message 
        }, { status: 500 });
      }

      // 6. Get public URL for the uploaded file
      const { data } = await supabase.storage
        .from('profile_image_files')
        .getPublicUrl(profile_image_file_name);

      // Assign the value (optional chaining for safety)
      profile_image_url = data?.publicUrl ?? null;

    }

    // 6. Get public URL for the uploaded file
    const { data: { publicUrl: resume_url } } = supabase.storage
      .from('resume_files')
      .getPublicUrl(fileName);

    const { data: { publicUrl: transcript_url } } = supabase.storage
      .from('transcript_files')
      .getPublicUrl(transcriptFileName);
    
      console.log("TRANSCRIPT URL ", transcript_url)


    // 7. Update subscriber profile
    const { error: dbError } = await supabase
      .from('subscribers')
      .update({
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        linkedin_url: formData.get('linkedin_url'),
        personal_website: formData.get('personal_website'),
        phone_number: formData.get('phone_number'),
        resume_url: resume_url,
        profile_image_url: profile_image_file ? profile_image_url : null,
        bio: formData.get('bio'),
        is_public_profile: formData.get('is_public_profile'),
        newsletter_opt_in: formData.get('newsletter_opt_in'),
        transcript_url: transcript_url
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

    return NextResponse.json({ success: true, resumeUrl: resume_url, profileImageUrl: profile_image_url });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}