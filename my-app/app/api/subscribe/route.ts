import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'


export async function POST(req: NextRequest) {

  try {
    
    // Parse form data
    const formData = await req.formData();

    // Extract required fields
    const email = formData.get('email');
    const first_name = formData.get('first_name');
    const last_name = formData.get('last_name');
    const linkedin_url = formData.get('linkedin_url');

    // Validate required fields
    if (!email || !linkedin_url) {
      return NextResponse.json({ error: 'Email and LinkedIn URL are required' }, { status: 400 });
    }

    // Get optional files from form data
    const resume_file = formData.get('resume_file');

    // Validate file types if they exist
    if (resume_file && !(resume_file instanceof File)) {
      return NextResponse.json({ error: 'Resume file is invalid' }, { status: 400 });
    }


    // Build insert object with all form data
    const insertData: Record<string, string | boolean> = {
      email: String(email),
    };

    // Only add fields that are present in formData
    if (first_name) insertData.first_name = String(first_name);
    if (last_name) insertData.last_name = String(last_name);
    if (linkedin_url) insertData.linkedin_url = String(linkedin_url);
    if (formData.get('phone_number')) insertData.phone_number = String(formData.get('phone_number'));
    if (formData.get('is_public_profile') !== null) insertData.is_public_profile = String(formData.get('is_public_profile')) === 'true';
    if (formData.get('newsletter_opt_in') !== null) insertData.newsletter_opt_in = String(formData.get('newsletter_opt_in')) === 'true';
    if (formData.get('needs_visa_sponsorship') !== null) insertData.needs_visa_sponsorship = String(formData.get('needs_visa_sponsorship')) === 'true';

    // Insert new subscriber record first to get the ID
    const { data: newSubscriber, error: insertError } = await supabase
      .from('subscribers')
      .upsert(insertData, {onConflict: 'email'})
      .select('id')
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (!newSubscriber?.id) {
      return NextResponse.json({ error: 'Failed to create subscriber record' }, { status: 500 });
    }

    let resume_url: string | null = null;
    
    // Check which folder pattern existing files use
    const userIdFolder = `${newSubscriber.id}/`;
  
    
    // Test both patterns for resume files
    const { data: resumesByUserId } = await supabase.storage.from('resume_files').list(userIdFolder);
  
    // Determine which pattern to use based on what has existing files
    let userFolder: string;
    if ((resumesByUserId?.length || 0) > 0) {
      userFolder = userIdFolder;
    } else {
      userFolder = userIdFolder;
    }

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
      const fileName = `${userFolder}resume.${resumeExtension}`;

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

      const { error: updateError } = await supabase
      .from('subscribers')
      .update({ resume_url: resume_url })
      .eq('id', newSubscriber.id)

      if (updateError) {
        console.error('Supabase update error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // Generate bio from LinkedIn URL asynchronously (don't await)
    if (linkedin_url) {
      (async () => {
        try {
          console.log('Generating bio from LinkedIn URL asynchronously');
          const baseUrl = process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : process.env.BASE_URL;
          const bioResponse = await fetch(`${baseUrl}/api/generate-bio-from-linkedin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              linkedin_url: String(linkedin_url),
              user_id: newSubscriber.id,
              first_name: first_name ? String(first_name) : '',
              last_name: last_name ? String(last_name) : ''
            })
          });

          if (bioResponse.ok) {
            const { bio, profilePhoto, profileData } = await bioResponse.json();
            console.log('Bio generated:', bio);

            // Update the subscriber record with the generated bio
            const { error: bioUpdateError } = await supabase
              .from('subscribers')
              .update({ bio, profile_image_url: profilePhoto })
              .eq('id', newSubscriber.id);

            if (bioUpdateError) {
              console.error('Failed to update bio:', bioUpdateError);
            }
          }
        } catch (error) {
          console.error('Async bio generation error:', error);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      subscriberId: newSubscriber.id,
      resumeUrl: resume_url
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
