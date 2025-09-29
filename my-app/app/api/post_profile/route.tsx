import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Handle both POST and PATCH requests with the same logic
async function handleProfileUpdate(req: NextRequest) {
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


    // Get optional files from form data
    const resume_file = formData.get('resume_file');
    const profile_image_file = formData.get('profile_image');
    const transcript_file = formData.get('transcript_file');

    // Validate file types if they exist
    if (resume_file && !(resume_file instanceof File)) {
      return NextResponse.json({ error: 'Resume file is invalid' }, { status: 400 });
    }

    if (profile_image_file && !(profile_image_file instanceof File)) {
      return NextResponse.json({ error: 'Profile image file is invalid' }, { status: 400 });
    }

    if (transcript_file && !(transcript_file instanceof File)) {
      return NextResponse.json({ error: 'Transcript file is invalid' }, { status: 400 });
    }


    // Initialize variables for file URLs
    let resume_url: string | null = null;
    let transcript_url: string | null = null;
    let profile_image_url: string | null = null;
    const userFolder = `${formData.get("id")}/`;

    // Handle resume file upload if provided
    if (resume_file instanceof File) {
      // Delete existing resume files
      const { data: existingResumeFiles } = await supabase.storage
        .from('resume_files')
        .list(userFolder);
      
      if (existingResumeFiles && existingResumeFiles.length > 0) {
        const resumeFilesToDelete = existingResumeFiles.map(file => `${userFolder}${file.name}`);
        await supabase.storage
          .from('resume_files')
          .remove(resumeFilesToDelete);
      }

      // Generate secure file name with original extension
      const resumeExtension = resume_file.name.split('.').pop() || 'pdf';
      const fileName = `${userFolder}/resume.${resumeExtension}`;

      // Upload resume file
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

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('resume_files')
        .getPublicUrl(fileName);
      resume_url = publicUrl;
    }

    // Handle transcript file upload if provided
    if (transcript_file instanceof File) {
      // Debug logging for transcript file

      // Validate file type explicitly
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(transcript_file.type)) {
        console.error('Invalid transcript file type:', transcript_file.type);
        return NextResponse.json({ 
          error: 'Invalid file type. Please upload a PDF or Word document.',
          receivedType: transcript_file.type
        }, { status: 400 });
      }

      // Delete existing transcript files
      const { data: existingTranscriptFiles } = await supabase.storage
        .from('transcript_files')
        .list(userFolder);
      
      if (existingTranscriptFiles && existingTranscriptFiles.length > 0) {
        const transcriptFilesToDelete = existingTranscriptFiles.map(file => `${userFolder}${file.name}`);
        await supabase.storage
          .from('transcript_files')
          .remove(transcriptFilesToDelete);
      }

      // Upload transcript file with explicit content type mapping
      const transcriptExtension = transcript_file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const transcriptFileName = `${userFolder}/transcript.${transcriptExtension}`;
      
      // Map file extension to proper content type
      let contentType = transcript_file.type;
      if (transcriptExtension === 'pdf') {
        contentType = 'application/pdf';
      } else if (transcriptExtension === 'doc') {
        contentType = 'application/msword';
      } else if (transcriptExtension === 'docx') {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }

      const { error: transcriptUploadError } = await supabase.storage
        .from('transcript_files')
        .upload(transcriptFileName, transcript_file, {
          contentType: contentType,
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

      // Get public URL for the uploaded file
      const { data: { publicUrl: transcriptPublicUrl } } = supabase.storage
        .from('transcript_files')
        .getPublicUrl(transcriptFileName);
      transcript_url = transcriptPublicUrl;
    }


    // Handle profile image upload if provided
    if (profile_image_file instanceof File) {
      // Debug logging for profile image file

      // Validate file type explicitly
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedImageTypes.includes(profile_image_file.type)) {
        console.error('Invalid profile image file type:', profile_image_file.type);
        return NextResponse.json({ 
          error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.',
          receivedType: profile_image_file.type
        }, { status: 400 });
      }

      // Delete existing profile image files
      const { data: existingProfileImages } = await supabase.storage
        .from('profile_image_files')
        .list(userFolder);
      
      if (existingProfileImages && existingProfileImages.length > 0) {
        const profileImageFilesToDelete = existingProfileImages.map(file => `${userFolder}${file.name}`);
        await supabase.storage
          .from('profile_image_files')
          .remove(profileImageFilesToDelete);
      }

      // Generate secure file name with original extension and explicit content type mapping
      const profileImageExtension = profile_image_file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const profile_image_file_name = `${userFolder}/profile_image.${profileImageExtension}`;

      // Map file extension to proper content type
      let contentType = profile_image_file.type;
      if (profileImageExtension === 'jpg' || profileImageExtension === 'jpeg') {
        contentType = 'image/jpeg';
      } else if (profileImageExtension === 'png') {
        contentType = 'image/png';
      } else if (profileImageExtension === 'gif') {
        contentType = 'image/gif';
      } else if (profileImageExtension === 'webp') {
        contentType = 'image/webp';
      }

      const { error: profile_image_uploadError } = await supabase.storage
        .from('profile_image_files')
        .upload(profile_image_file_name, profile_image_file, {
          contentType: contentType,
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

      // Get public URL for the uploaded file
      const { data } = await supabase.storage
        .from('profile_image_files')
        .getPublicUrl(profile_image_file_name);

      // Assign the value (optional chaining for safety)
      profile_image_url = data?.publicUrl ?? null;
    }

    // Build update object with only provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    
    // Only update fields that are present in formData
    if (formData.get('first_name')) updateData.first_name = String(formData.get('first_name'));
    if (formData.get('last_name')) updateData.last_name = String(formData.get('last_name'));
    if (formData.get('school')) updateData.school = String(formData.get('school'));
    if (formData.get('linkedin_url')) updateData.linkedin_url = String(formData.get('linkedin_url'));
    if (formData.get('personal_website')) updateData.personal_website = String(formData.get('personal_website'));
    if (formData.get('phone_number')) updateData.phone_number = String(formData.get('phone_number'));
    if (formData.get('bio')) updateData.bio = String(formData.get('bio'));
    if (formData.get('is_public_profile') !== null) updateData.is_public_profile = String(formData.get('is_public_profile')) === 'true';
    if (formData.get('newsletter_opt_in') !== null) updateData.newsletter_opt_in = String(formData.get('newsletter_opt_in')) === 'true';
    if (formData.get('applied') !== null) updateData.applied = String(formData.get('applied')) === 'true';
    if (formData.get('verified') !== null) updateData.verified = String(formData.get('verified')) === 'true';
    if (formData.get('school')) updateData.school = String(formData.get('school'));

    // Update file URLs if new files were uploaded
    if (resume_url) updateData.resume_url = resume_url;
    if (transcript_url) updateData.transcript_url = transcript_url;
    if (profile_image_url) updateData.profile_image_url = profile_image_url;
    
    // Reset parsed_resume_json if new resume was uploaded
    if (resume_url) updateData.parsed_resume_json = "";

    // Only proceed with update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, message: 'No fields to update' });
    }

    // Update subscriber profile using authenticated user's email
    // This ensures we update the correct user even if formData ID is missing/invalid
    const { error: dbError } = await supabase
      .from('subscribers')
      .update(updateData)
      .eq('email', user.email);

    if (dbError) {
      console.error('Profile update error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to update profile', 
        details: dbError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      resumeUrl: resume_url, 
      transcriptUrl: transcript_url,
      profileImageUrl: profile_image_url,
      updatedFields: Object.keys(updateData)
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// Export both POST and PATCH methods
export async function POST(req: NextRequest) {
  return handleProfileUpdate(req);
}

export async function PATCH(req: NextRequest) {
  return handleProfileUpdate(req);
}

// Add debugging for unsupported methods
export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed', 
    message: 'This endpoint only supports POST and PATCH requests',
    supportedMethods: ['POST', 'PATCH']
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ 
    error: 'Method not allowed', 
    message: 'This endpoint only supports POST and PATCH requests',
    supportedMethods: ['POST', 'PATCH']
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ 
    error: 'Method not allowed', 
    message: 'This endpoint only supports POST and PATCH requests',
    supportedMethods: ['POST', 'PATCH']
  }, { status: 405 });
}