import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const { project_url , action } = await req.json();
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session?.user?.email;

    const { data, error: fetchError } = await supabase
      .from('subscribers')
      .select('project_urls')
      .eq('email', userEmail)
      .single()

    if (fetchError) {
      console.error('Bookmark update error:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to bookmark', 
        details: fetchError.message 
      }, { status: 500 });
    }

    const projects = data?.project_urls ?? [];

    let updatedProjects;
    if (action === "add") {
        updatedProjects = projects.includes(project_url)
        ? projects
        : [...projects, project_url];
    } else if (action === "remove") {
        updatedProjects = projects.filter((c: number) => c !== project_url);
    }

    const { error: updateError } = await supabase
      .from('subscribers')
      .update({ project_urls: updatedProjects })
      .eq('email', userEmail);

    if (updateError) {
      console.error('Project update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update projects', 
        details: updateError.message 
      }, { status: 500 });
    }



    return NextResponse.json({ success: true, projects: updatedProjects });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}