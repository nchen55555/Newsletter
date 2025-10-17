'use client'
import React from "react";
import { useState, useEffect } from "react";
import { Repeat2, Send, Bold, Italic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CompanyRow } from "../companies/company-row";
import { CompanyWithImageUrl, ConnectionData, ProfileData } from "@/app/types";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ProfileAvatar from './profile_avatar';
import { ConnectionScale } from './connection-scale';
import { FeedPreview } from './feed-preview';
import { encodeSimple } from "../utils/simple-hash";

export default function Post({ 
  company, 
  companyData, 
  feedId, 
  isDemo = false, 
  onRepost 
}: { 
  company?: number; 
  companyData?: CompanyWithImageUrl; 
  feedId?: string; 
  isDemo?: boolean; 
  onRepost?: () => void; 
}) {
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [audienceScale, setAudienceScale] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<{ id: number, first_name: string; last_name: string; profile_image_url?: string } | null>(null);
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<ConnectionData[]>([]);
  const [connectionProfiles, setConnectionProfiles] = useState<ProfileData[]>([]);

  // Tiptap editor setup
  const editor = useEditor({
    extensions: [StarterKit],
    content: isDemo ? '<p>Demo!</p>' : '<p>Could be interesting to see how they go up against their competitors... </p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none min-h-[100px] p-3 border border-input rounded-md bg-background',
      },
    },
  });

  // Check if user is verified
  useEffect(() => {
    let isMounted = true;
    async function checkVerification() {
      try {
        const res = await fetch("/api/get_profile", { credentials: "include" });
        if (!res.ok) return;
        const profile = await res.json();
        if (isMounted) {
          setIsVerified(profile.verified || false);
          setUserProfile({
            id: profile.id,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            profile_image_url: profile.profile_image_url

          });
          
          // Combine connections and pending connections
          const allConnections = [
            ...(profile.connections_new || []),
            ...(profile.pending_connections_new || [])
          ];
          setConnections(allConnections);
        }
      } catch (e) {
        console.log("Failed to fetch verification status:", e);
        if (isMounted) {
          setIsVerified(false);
        }
      }
    }
    checkVerification();
    return () => { isMounted = false; };
  }, []);

  // Handle audience selection and filter connections
  const handleAudienceSelection = async (scale: number) => {
    setAudienceScale(scale);

    console.log("SCALE ", scale)
    
    // Filter connections based on rating that matches the selected scale
    const filtered = connections.filter(connection => connection.rating === scale);
    setFilteredConnections(filtered);
    
    // Fetch profile data for each filtered connection
    const profilePromises = filtered.slice(0, 6).map(async (connection) => {
      try {
        const res = await fetch(`/api/get_external_profile?id=${encodeSimple(connection.connect_id)}`, { credentials: 'include' });

        if (res.ok) {
          return await res.json();
        }
        return null;
      } catch (error) {
        console.error(`Failed to fetch profile for ${connection.connect_id}:`, error);
        return null;
      }
    });
    
    const profiles = await Promise.all(profilePromises);
    setConnectionProfiles(profiles.filter(profile => profile !== null));
    console.log("Connections and filtered ", connections, filtered, connectionProfiles);

  };

  const handlePost = async () => {
    if (!editor) return;
    
    setLoading(true);
    
    // Handle demo mode
    if (isDemo) {
      // Simulate posting delay
      setTimeout(() => {
        setLoading(false);
        setOpen(false);
        onRepost?.(); // Trigger tour callback
        // Reset editor for next use
        editor.commands.setContent('<p>Demo!</p>');
      }, 1000);
      return;
    }
    
    try {
      // const content = editor.getJSON();
      const contentHTML = editor.getHTML();
      
      const response = await fetch('/api/post_thread', {
        method: 'POST',
        body: JSON.stringify({
          subscriber_id: userProfile?.id, 
          company_id: company,
          feed_id: feedId,
          content: contentHTML, 
          rating: audienceScale
        })
      });

      if (response.ok) {
        // Reset form and close dialog
        editor.commands.setContent('<p>Share your thoughts or updates with this opportunity...</p>');
        setOpen(false);
        
        // Show success alert and redirect after delay
        setTimeout(() => {
          window.location.href = '/articles';
        }, 2000); // 2 second delay to show the alert
      } else {
        throw new Error('Failed to post thread');
      }
      
    } catch (error) {
      console.error("Error posting thread:", error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user is not verified
  if (!isVerified) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Repost company"
          className="transition-all duration-300"
        >
          <Repeat2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Share Your Thread of Thought
            {isDemo && <span className="ml-2 text-sm text-gray-600">(Demo Mode)</span>}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {isDemo 
              ? "✨ in demo mode, your post won't be published but will complete the tour step!" 
              : "Thoughts or questions about the company profile, your experience chatting with the team, or relevant industry insights? We want to hear your thoughts!"
            }
          </p>
        </DialogHeader>
        <div className="space-y-4">
          {/* Complete post section */}
          <div className="p-3 border border-input rounded-lg space-y-3">
            {/* User profile and formatting toolbar */}
            <div className="flex items-center justify-between p-2 border border-input rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                {userProfile && (
                  <>
                    <ProfileAvatar
                      name={`${userProfile.first_name} ${userProfile.last_name}`.trim() || 'User'}
                      imageUrl={userProfile.profile_image_url}
                      size={32}
                      editable={false}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm font-medium">
                      {userProfile.first_name} {userProfile.last_name}
                    </span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={editor?.isActive('bold') ? 'bg-accent' : ''}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={editor?.isActive('italic') ? 'bg-accent' : ''}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Editor content */}
            <div className="min-h-[100px]">
              <EditorContent editor={editor} />
            </div>
            
            {/* Company repost preview */}
            {companyData && (
              <div className="flex items-center gap-3 pt-2 border-t border-input">
                <Repeat2 className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <CompanyRow company={companyData} />
                </div>
              </div>
            )}
            
            {/* Feed repost preview */}
            {feedId && !companyData && (
              <div className="flex items-center gap-3 pt-2 border-t border-input">
                <Repeat2 className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <FeedPreview feedId={feedId} />
                </div>
              </div>
            )}
          </div>

          {/* Audience selection */}
          <div className="space-y-3">
              <ConnectionScale
                onSubmit={handleAudienceSelection}
                isSubmitting={false}
                personName="connections"
                initialRating={audienceScale || undefined}
                mode="audience"
                showConnectButton={false}
              />
              
              {/* Show filtered connections when audience is selected */}
              {audienceScale && (
                <>
                  {connectionProfiles.length > 0 ? (
                    <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                      <p className="text-sm font-medium text-neutral-700 mb-3">
                        Your selection surfaced people like this:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {connectionProfiles.map((profile, index) => (
                          <div key={index} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-neutral-200">
                            <ProfileAvatar
                              name={`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'}
                              imageUrl={profile.profile_image_url}
                              size={24}
                              editable={false}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-xs font-medium text-neutral-700">
                              {profile.first_name} {profile.last_name}
                            </span>
                          </div>
                        ))}
                        {filteredConnections.length > connectionProfiles.length && (
                          <div className="flex items-center justify-center bg-white rounded-lg p-2 border border-neutral-200 text-xs text-neutral-500">
                            +{filteredConnections.length - connectionProfiles.length} more
                          </div>
                        )}
                      </div>
                    </div>
                  ) : audienceScale !== 1 ? (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        No one will get to see this thread because there is no one in your network that falls in that category.
                      </p>
                    </div>
                  ) : null}
                </>
              )}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handlePost}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              "Sharing..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Share Thread
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    
    </Dialog>
  );
}