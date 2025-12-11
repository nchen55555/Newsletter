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
    const { connect_id, rating, note } = body;

    console.log('connect_id', connect_id);
    console.log('rating', rating);
    console.log('note', note);
    
    if (!connect_id) {
      return NextResponse.json({ error: 'connect_id is required' }, { status: 400 });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
    }

    // Require a note for new connection requests, but allow rating-only updates to omit it

    // 4. Get the current user's profile to retrieve existing connections and pending connections
    const { data: currentProfile, error: fetchError } = await supabase
      .from('subscribers')
      .select('id, connections_new, pending_connections_new, requested_connections_new, first_name, last_name, applied')
      .eq('email', user.email)
      .single();

    const { error: dbError } = await supabase
      .from('subscribers')
      .update({applied: "true"})
      .eq('email', user.email)
    
    if (dbError) {
      console.log("error submitting applied to profile", dbError)
      return NextResponse.json({ 
        error: 'Failed to fetch current profile', 
        details: dbError.message 
      }, { status: 500 });
    }

    if (fetchError) {
      console.error('Error fetching current profile:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch current profile', 
        details: fetchError.message 
      }, { status: 500 });
    }

    // 5. Get existing connections array or initialize empty array
    let connections: {connect_id: number, rating: number, note: string}[] = [];
    let pendingConnections: {connect_id: number, rating: number, note: string}[] = [];
    let requestedConnections: {connect_id: number, rating: number, note: string}[] = [];
    
    if (currentProfile?.connections_new && Array.isArray(currentProfile.connections_new)) {
      connections = currentProfile.connections_new;
    }

    if (currentProfile?.pending_connections_new && Array.isArray(currentProfile.pending_connections_new)) {
      pendingConnections = currentProfile.pending_connections_new;
    }

    if (currentProfile?.requested_connections_new && Array.isArray(currentProfile.requested_connections_new)) {
      requestedConnections = currentProfile.requested_connections_new;
    }

    console.log('Current user profile connections:', currentProfile?.connections_new);
    console.log('Initialized connections array:', connections);

    const connectIdNum = parseInt(connect_id);
    const currentUserId = currentProfile?.id;

    // 6. Check if already connected and update rating/note if exists
    const existingConnectionIndex = connections.findIndex(conn => conn.connect_id === connectIdNum);
    if (existingConnectionIndex !== -1) {
      // Update the existing connection's rating
      connections[existingConnectionIndex].rating = rating;
      // Optionally update note if provided and long enough
      if (note && note.trim().length >= 20) {
        connections[existingConnectionIndex].note = note.trim();
      }
      
      // Update the database
      const { error: updateError } = await supabase
        .from('subscribers')
        .update({ connections_new: connections })
        .eq('email', user.email);
      
      if (updateError) {
        console.error('Error updating connection rating:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update connection rating', 
          details: updateError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Connection rating updated successfully',
        connections: connections,
        type: 'rating_update'
      });
    }

    // 7. Get the target user's profile to check their pending connections
    const { data: targetProfile, error: targetFetchError } = await supabase
      .from('subscribers')
      .select('pending_connections_new, connections_new, requested_connections_new, first_name, email')
      .eq('id', connectIdNum)
      .single();

    if (targetFetchError) {
      console.error('Error fetching target profile:', targetFetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch target profile', 
        details: targetFetchError.message 
      }, { status: 500 });
    }

    let targetPendingConnections: {connect_id: number, rating: number, note: string}[] = [];
    let targetConnections: {connect_id: number, rating: number, note: string}[] = [];
    let targetRequestedConnections: {connect_id: number, rating: number, note: string}[] = [];
    
    if (targetProfile?.requested_connections_new && Array.isArray(targetProfile.requested_connections_new)) {
      targetRequestedConnections = targetProfile.requested_connections_new;
    }
    
    if (targetProfile?.pending_connections_new && Array.isArray(targetProfile.pending_connections_new)) {
      targetPendingConnections = targetProfile.pending_connections_new;
    }

    if (targetProfile?.connections_new && Array.isArray(targetProfile.connections_new)) {
      targetConnections = targetProfile.connections_new;
    }

    console.log('Target user profile connections:', targetProfile?.connections_new);
    console.log('Target user profile pending_connections:', targetProfile?.pending_connections_new);
    console.log('Initialized target connections array:', targetConnections);
    console.log('Initialized target pending array:', targetPendingConnections);

    // 8. Check if current user's ID is already in target's pending connections
    const currentUserInTargetPending = requestedConnections.some(conn => conn.connect_id === connectIdNum);

    if (currentUserInTargetPending) {
      // This is a reciprocal connection - create mutual connection
      console.log('Creating mutual connection...');
      console.log('Before update - Current user connections:', connections);
      console.log('Before update - Target user connections:', targetConnections);
      console.log('Before update - Target pending:', targetPendingConnections);
      
      // Find the existing request to get the other user's rating
      const existingRequest = requestedConnections.find(conn => conn.connect_id === connectIdNum);
      const otherUserRating = existingRequest ? existingRequest.rating : 3; // Default rating if not found
      
      // Add each other to connections and remove from pending_connections
      connections.push({connect_id: connectIdNum, rating: rating, note: note});
      targetConnections.push({connect_id: currentUserId, rating: otherUserRating, note: note});
      
      console.log('After push - Current user connections:', connections);
      console.log('After push - Target user connections:', targetConnections);
      
      // Remove current user's ID from target's pending connections
      const updatedTargetPending = targetPendingConnections.filter(conn => conn.connect_id !== currentUserId);
      const updatedRequestedConnections = requestedConnections.filter(conn => conn.connect_id !== connectIdNum);
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
          .update({ connections_new: connections, requested_connections_new: updatedRequestedConnections })
          .eq('email', user.email),
        supabase
          .from('subscribers')
          .update({ 
            connections_new: targetConnections,
            pending_connections_new: updatedTargetPending
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

      const senderName = currentProfile?.first_name && currentProfile?.last_name
      ? `${currentProfile.first_name} ${currentProfile.last_name}`
      : user.email;
      
    const emailContent = {
      message: `${senderName} just accepted your request to join their verified professional network on The Niche.`
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
      to: [targetProfile.email],
      subject: `${senderName} accepted your request to join their network on The Niche`,
      bcc: [`${user.email}`],
      html: `
        <p>Hi ${targetProfile.first_name},</p>
        <p>${emailContent.message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
        <p><a href="https://theniche.tech/people/${encodeSimple(currentUserId)}" style="color: #0066cc; text-decoration: none;">Visit your network on The Niche</a></p>
        <p>Best,<br><br>The Niche Team</p>
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
        message: 'Mutual connection created successfully',
        connections: connections,
        newConnectionId: connectIdNum,
        type: 'mutual'
      });
    } else {
      // This is a new request - add current user's ID to target's pending connections
        pendingConnections.push({connect_id: parseInt(connect_id), rating: rating, note: note});
        targetRequestedConnections.push({connect_id: currentUserId, rating: rating, note: note});
        console.log("pending connections for user now ", targetPendingConnections, "and connections ", targetConnections)

        // 9. Update the target's profile with the new pending connections array
        console.log('About to update pending connections for target user ID:', connectIdNum);
        console.log('New pending connections array:', targetPendingConnections);

        await Promise.all([
        supabase
         .from('subscribers')
          .update({ pending_connections_new: pendingConnections })
          .eq('email', user.email),
        supabase
          .from('subscribers')
          .update({ requested_connections_new: targetRequestedConnections })
          .eq('id', connect_id)
      ]);
        

    }
      
    // Create email content using decoupled data (only for pending requests)
    const senderName = currentProfile?.first_name && currentProfile?.last_name
      ? `${currentProfile.first_name} ${currentProfile.last_name}`
      : user.email;
      
    const emailContent = {
      message: `${senderName} just sent you a request to join their verified professional network on The Niche.`
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
      to: [targetProfile.email],
      subject: `${senderName} wants to invite you to their network on The Niche`,
      bcc: [`${user.email}`],
      html: `
        <p>Hi ${targetProfile.first_name},</p>
        <p>${emailContent.message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
        <p><a href="https://theniche.tech/people/${encodeSimple(currentUserId)}" style="color: #0066cc; text-decoration: none;">Visit your network on The Niche</a></p>
        <p>Best,<br><br>The Niche Team</p>
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