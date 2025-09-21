import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { encodeSimple } from '../../utils/simple-hash';

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
    const { connect_id } = body;
    
    if (!connect_id) {
      return NextResponse.json({ error: 'connect_id is required' }, { status: 400 });
    }

    // 4. Get the current user's profile to retrieve existing connections and pending connections
    const { data: currentProfile, error: fetchError } = await supabase
      .from('subscribers')
      .select('id, connections, pending_connections')
      .eq('email', user.email)
      .single();

    if (fetchError) {
      console.error('Error fetching current profile:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch current profile', 
        details: fetchError.message 
      }, { status: 500 });
    }

    // 5. Get existing connections array or initialize empty array
    let connections: number[] = [];
    let pendingConnections: number[] = [];
    
    if (currentProfile?.connections && Array.isArray(currentProfile.connections)) {
      connections = currentProfile.connections;
    }

    if (currentProfile?.pending_connections && Array.isArray(currentProfile.pending_connections)) {
      pendingConnections = currentProfile.pending_connections;
    }
    
    console.log('Current user profile connections:', currentProfile?.connections);
    console.log('Initialized connections array:', connections);

    const connectIdNum = parseInt(connect_id);
    const currentUserId = currentProfile?.id;

    // 6. Check if already connected
    if (connections.includes(connectIdNum)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Connection already exists',
        connections: connections
      });
    }

    // 7. Get the target user's profile to check their pending connections
    const { data: targetProfile, error: targetFetchError } = await supabase
      .from('subscribers')
      .select('pending_connections, connections')
      .eq('id', connectIdNum)
      .single();

    if (targetFetchError) {
      console.error('Error fetching target profile:', targetFetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch target profile', 
        details: targetFetchError.message 
      }, { status: 500 });
    }

    let targetPendingConnections: number[] = [];
    let targetConnections: number[] = [];
    
    if (targetProfile?.pending_connections && Array.isArray(targetProfile.pending_connections)) {
      targetPendingConnections = targetProfile.pending_connections;
    }
    
    if (targetProfile?.connections && Array.isArray(targetProfile.connections)) {
      targetConnections = targetProfile.connections;
    }
    
    console.log('Target user profile connections:', targetProfile?.connections);
    console.log('Target user profile pending_connections:', targetProfile?.pending_connections);
    console.log('Initialized target connections array:', targetConnections);
    console.log('Initialized target pending array:', targetPendingConnections);

    // 8. Check if current user's ID is already in target's pending connections
    const currentUserInTargetPending = targetPendingConnections.includes(currentUserId);

    if (currentUserInTargetPending) {
      // This is a reciprocal connection - create mutual connection
      console.log('Creating mutual connection...');
      console.log('Before update - Current user connections:', connections);
      console.log('Before update - Target user connections:', targetConnections);
      console.log('Before update - Target pending:', targetPendingConnections);
      
      // Add each other to connections and remove from pending_connections
      connections.push(connectIdNum);
      targetConnections.push(currentUserId);
      
      console.log('After push - Current user connections:', connections);
      console.log('After push - Target user connections:', targetConnections);
      
      // Remove current user's ID from target's pending connections
      const updatedTargetPending = targetPendingConnections.filter(id => id !== currentUserId);
      console.log('Updated target pending:', updatedTargetPending);
      
      // Update both users' profiles
      console.log('About to update database with:');
      console.log('Current user email:', user.email);
      console.log('Current user new connections:', connections);
      console.log('Target user ID:', connectIdNum);
      console.log('Target user new connections:', targetConnections);
      console.log('Target user new pending:', updatedTargetPending);
      
      const updateResults = await Promise.all([
        supabase
          .from('subscribers')
          .update({ connections: connections })
          .eq('email', user.email),
        supabase
          .from('subscribers')
          .update({ 
            connections: targetConnections,
            pending_connections: updatedTargetPending
          })
          .eq('id', connect_id)
      ]);
      
      console.log('Database update results:', updateResults);
      console.log('Current user update result:', JSON.stringify(updateResults[0], null, 2));
      console.log('Target user update result:', JSON.stringify(updateResults[1], null, 2));
      
      // Check for errors and log them
      if (updateResults[0].error) {
        console.error('Error updating current user:', updateResults[0].error);
        return NextResponse.json({ 
          error: 'Failed to update current user connections', 
          details: updateResults[0].error.message 
        }, { status: 500 });
      }
      if (updateResults[1].error) {
        console.error('Error updating target user:', updateResults[1].error);
        return NextResponse.json({ 
          error: 'Failed to update target user connections', 
          details: updateResults[1].error.message 
        }, { status: 500 });
      }

      // Check if updates actually affected any rows
      console.log('Rows affected - Current user:', updateResults[0].count);
      console.log('Rows affected - Target user:', updateResults[1].count);

      return NextResponse.json({ 
        success: true,
        message: 'Mutual connection created successfully',
        connections: connections,
        newConnectionId: connectIdNum,
        type: 'mutual'
      });
    } else {
      // This is a new request - add current user's ID to target's pending connections
        pendingConnections.push(connect_id);
        console.log("pending connections for user now ", targetPendingConnections, "and connections ", targetConnections)

        // 9. Update the target's profile with the new pending connections array
        console.log('About to update pending connections for target user ID:', connectIdNum);
        console.log('New pending connections array:', targetPendingConnections);
        
        const { error: updateError, count } = await supabase
          .from('subscribers')
          .update({ pending_connections: pendingConnections })
          .eq('email', user.email);


        if (updateError) {
          console.error('===== FULL SUPABASE ERROR =====');
          console.error('Error message:', updateError.message);
          console.error('Error code:', updateError.code);
          console.error('Error details:', updateError.details);
          console.error('Full error object:', JSON.stringify(updateError, null, 2));
          console.error('===============================');
          return NextResponse.json({ 
            error: 'Failed to update connections', 
            details: updateError.message,
            code: updateError.code
          }, { status: 500 });
        }
        console.log('Rows affected by pending connection update:', count);

    }


      const { data: currentUserData, error: currentUserError } = await supabase
        .from('subscribers')
        .select('first_name, last_name')
        .eq('email', user.email)
        .single();

      if (currentUserError || !currentUserData) {
        console.error('Error fetching current user data:', currentUserError);
        // Continue without sender name if fetch fails
      }

      

      // Send email notification for new pending request
      const { data: sendProfile, error: sendFetchError } = await supabase
        .from('subscribers')
        .select('first_name, email')
        .eq('id', connectIdNum)
        .single();

    if (sendFetchError) {
      console.error('Error fetching current profile:', sendFetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch current profile', 
        details: sendFetchError.message 
      }, { status: 500 });
    }

    // Create email content using decoupled data (only for pending requests)
    const senderName = currentUserData?.first_name && currentUserData?.last_name 
      ? `${currentUserData.first_name} ${currentUserData.last_name}`
      : user.email;
      
    const emailContent = {
      message: `${senderName} just sent you a connection request on The Niche! If you connect back, you'll both be added to each other's verified network. Visit your network to respond to the request.`
    };
    // Check if API key exists
    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
      console.error('NEXT_PUBLIC_RESEND_API_KEY is not set in environment variables');
      return NextResponse.json({ 
        error: 'Email service not configured - missing API key' 
      }, { status: 500 });
    }

    const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'Nicole <nicole@theniche.tech>',
      to: [sendProfile.email],
      subject: '[THE NICHE] Someone Wants to Connect With You!',
      html: `
        <p>Hi ${sendProfile.first_name},</p>
        <p>${emailContent.message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
        <p><a href="https://theniche.tech/people/${encodeSimple(currentUserId)}" style="color: #0066cc; text-decoration: none;">Visit your network on The Niche</a></p>
        <p>Best,<br>The Niche Team</p>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return NextResponse.json({ 
        error: 'Failed to send welcome email', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('Email sent successfully:', data);


      return NextResponse.json({ 
        success: true,
        message: 'Connection request sent successfully',
        target_pending_connections: targetPendingConnections,
        newConnectionId: connectIdNum,
        type: 'pending'
      });
    

  } catch (error) {
    console.error('Unexpected error in post_connect:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}