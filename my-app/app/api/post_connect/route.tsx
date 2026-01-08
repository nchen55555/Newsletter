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

    // 8. Check if current user's ID is already in target's pending connections
    const currentUserInTargetPending = requestedConnections.some(conn => conn.connect_id === connectIdNum);

    if (currentUserInTargetPending) {
      
      // Find the existing request to get the other user's rating
      const existingRequest = requestedConnections.find(conn => conn.connect_id === connectIdNum);
      const otherUserRating = existingRequest ? existingRequest.rating : 3; // Default rating if not found
      
      // Add each other to connections and remove from pending_connections
      connections.push({connect_id: connectIdNum, rating: rating, note: note});
      targetConnections.push({connect_id: currentUserId, rating: otherUserRating, note: note});
      
      
      // Remove current user's ID from target's pending connections
      const updatedTargetPending = targetPendingConnections.filter(conn => conn.connect_id !== currentUserId);
      const updatedRequestedConnections = requestedConnections.filter(conn => conn.connect_id !== connectIdNum);
      
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


      const senderName = currentProfile?.first_name && currentProfile?.last_name
      ? `${currentProfile.first_name} ${currentProfile.last_name}`
      : user.email;
      
    const emailContent = {
      message: `${senderName} and you are now verified connections on The Niche Network. If at any point, you would like to modify the context behind your connection, feel free to update it on your profile. Your updates are never sent to the other person. `
    };
    // Check if API key exists
    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
      console.error('NEXT_PUBLIC_RESEND_API_KEY is not set in environment variables');
      return NextResponse.json({ 
        error: 'Email service not configured - missing API key' 
      }, { status: 500 });
    }

    const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: 'The Niche <thenichenetwork@theniche.tech>',
      to: [targetProfile.email],
      subject: `${senderName} and you are now verified connections on The Niche Network`,
      html: `
        <p>Hi ${targetProfile.first_name},</p>
        <p>${emailContent.message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
        <p><a href="https://theniche.tech/people/${encodeSimple(connect_id)}" style="color: #0066cc; text-decoration: none;">Visit your connection with ${senderName} on the Niche Niche</a></p>
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
      message: `${senderName} has requested to join your verified professional network on The Niche. Click their profile to add them to your network and contextualize the relationship. If at any point, you would like to modify the context behind your connection, your updates are never sent to the other person.`
    };
    // Check if API key exists
    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
      console.error('NEXT_PUBLIC_RESEND_API_KEY is not set in environment variables');
      return NextResponse.json({ 
        error: 'Email service not configured - missing API key' 
      }, { status: 500 });
    }

    const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: 'The Niche <thenichenetwork@theniche.tech>',
      to: [targetProfile.email],
      subject: `${senderName} has requested to be a part of your Niche Network`,
      html: `
        <p>Hi ${targetProfile.first_name},</p>
        <p>${emailContent.message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
        <p><a href="https://theniche.tech/people/${encodeSimple(connect_id)}" style="color: #0066cc; text-decoration: none;">Add ${senderName} to your Niche Network</a></p>
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