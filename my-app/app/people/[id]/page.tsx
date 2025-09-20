
"use client";
import { useEffect, useState } from "react";
import { Navigation } from "../../components/header";
import { Container } from "../../components/container";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProfileData } from "@/app/types";
import { Linkedin, Globe, UserPlus } from "lucide-react";
import ProfileAvatar from "../../components/profile_avatar";
import { decodeSimple } from "../../utils/simple-hash";

export default function PeopleProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationPhone, setVerificationPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error' | 'invalid'>('idle');
  const [statusMessage, setStatusMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAlreadyConnected, setIsAlreadyConnected] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setProfileId(id);
      
      // Decode the hashed ID to get the actual profile ID
      const actualId = decodeSimple(id);
      if (!actualId) {
        console.error('Invalid profile ID hash:', id);
        setData(null);
        setLoading(false);
        return;
      }
      
      // Fetch profile data using the external profile API
      const apiUrl = `/api/get_external_profile?id=${actualId}`;
      
      try {
        const res = await fetch(apiUrl);
        if (res.ok) {
          const profileData = await res.json();
          setData(profileData);
        } else {
          setData(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    
    getParams();
  }, [params]);

  // Check if user is already connected to this profile
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!profileId) return;
      
      try {
        const actualId = decodeSimple(profileId);
        if (!actualId) return;
        
        // Fetch user's connections from get_profile API
        const response = await fetch("/api/get_profile", { credentials: "include" });
        if (response.ok) {
          const userData = await response.json();
          const userConnections = userData.connections || [];
          
          // Check if this profile's actual ID is in the user's connections
          const isConnected = userConnections.includes(actualId);
          setIsAlreadyConnected(isConnected);
        } else {
          console.error("Failed to fetch user connections");
          setIsAlreadyConnected(false);
        }
      } catch (error) {
        console.error("Error checking connection status:", error);
        setIsAlreadyConnected(false);
      }
    };
    
    checkConnectionStatus();
  }, [profileId]);



  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Reset form and status when dialog closes
      setVerificationEmail("");
      setVerificationPhone("");
      setVerificationStatus('idle');
      setStatusMessage("");
    }
  };

  const handleNetworkVerification = async () => {
    if (!verificationEmail && !verificationPhone) {
      setVerificationStatus('invalid');
      setStatusMessage("Please provide either an email or phone number to verify your connection.");
      return;
    }

    setIsSubmitting(true);
    setVerificationStatus('idle');
    
    try {
      const isVerified = verificationEmail === data?.email || verificationPhone === data?.phone_number;
      
      if (isVerified) {
        const response = await fetch('/api/post_connect', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({connect_id: data?.id})
        });
        
        if (response.ok) {
          setVerificationStatus('success');
          setStatusMessage(`You have now added ${data?.first_name}! They've received a notification that you've connected with them.`);
          setVerificationEmail("");
          setVerificationPhone("");
        } else {
          setVerificationStatus('error');
          setStatusMessage("Failed to send verification request. Please try again.");
        }
      } else {
        setVerificationStatus('invalid');
        setStatusMessage("Request not verified. Wrong email or phone number.");
      }
    } catch (error) {
      console.error('Network verification failed:', error);
      setVerificationStatus('error');
      setStatusMessage("Failed to send verification request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
        <Navigation />
        <div className="pt-12 pb-8 px-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
          <Container className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-32 w-full" />
            </div>
          </Container>
        </div>
      </div>
    );
  }

  if (!data || !profileId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
        <Navigation />
        <div className="pt-12 pb-8 px-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
          <Container className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Profile Not Found</h1>
              <p className="text-neutral-600">The profile you&apos;re looking for doesn&apos;t exist or isn&apos;t available.</p>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <div className="pt-12 pb-8 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
        <Container className="max-w-6xl mx-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-8">
              {/* Welcome Header */}
              <div className="text-center pt-16 pb-8">
                <div className="flex items-center gap-6 mb-6">
                  <ProfileAvatar
                    name={`${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email || 'User'}
                    imageUrl={data.profile_image_url || undefined}
                    size={160}
                    editable={false}
                    className="w-40 h-40 rounded-full"
                  />

                  <div className="min-w-0 text-left">
                    <h1 className="text-4xl md:text-5xl font-semibold text-black mb-4">
                      {data.first_name} {data.last_name}
                    </h1>
                    
                    {isAlreadyConnected ? (
                      <Button disabled className="inline-flex items-center gap-2 bg-green-100 text-green-800 border-green-300">
                        <UserPlus className="w-4 h-4" />
                        Already Connected
                      </Button>
                    ) : (
                      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
                        <DialogTrigger asChild>
                          <Button className="inline-flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Add To Network
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Verify Connection with {data.first_name}</DialogTitle>
                          <DialogDescription>
                            To add {data.first_name} to your verified network, please provide their email and/or phone number. We&apos;ll confirm your connection to maintain network quality.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 mt-6">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder={"sam@gmail.com"}
                              value={verificationEmail}
                              onChange={(e) => setVerificationEmail(e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>
                          <p>or...</p>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="(555) 123-4567"
                              value={verificationPhone}
                              onChange={(e) => setVerificationPhone(e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>
                          
                          {/* Status Message Display */}
                          {verificationStatus !== 'idle' && (
                            <div className={`mt-6 p-4 rounded-lg text-sm ${
                              verificationStatus === 'success' 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : verificationStatus === 'error'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            }`}>
                              {statusMessage}
                            </div>
                          )}
                          
                          <div className="flex justify-end gap-2 mt-8">
                            <DialogTrigger asChild>
                              <Button variant="outline" disabled={isSubmitting}>
                                Cancel
                              </Button>
                            </DialogTrigger>
                            <Button 
                              onClick={handleNetworkVerification}
                              disabled={isSubmitting || (!verificationEmail && !verificationPhone)}
                            >
                              {isSubmitting ? "Verifying..." : "Send Verification"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              {data.bio && data.bio.length > 0 && (
                <div className="w-full max-w-4xl space-y-3">
                  <h3 className="text-sm font-medium text-neutral-900">Bio</h3>
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                      {data.bio}
                    </div>
                  </div>
                </div>
              )}

              {/* Interests */}
              {data.interests && data.interests.length > 0 && (
                <div className="w-full max-w-4xl space-y-3">
                  <h3 className="text-sm font-medium text-neutral-900">Interests & Background</h3>
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                      {data.interests}
                    </div>
                  </div>
                </div>
              )}

              {/* Links and Documents */}
              {(data.linkedin_url || data.personal_website || data.transcript_url || data.resume_url) && (
                <div className="w-full max-w-4xl">
                  <div className="flex flex-wrap gap-3">
                    {data.linkedin_url && (
                      <Button asChild variant="outline" size="sm">
                        <a href={data.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {data.personal_website && (
                      <Button asChild variant="outline" size="sm">
                        <a href={data.personal_website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center text-sm text-neutral-600 py-8">
                Network Profile
                <div className="mt-2 text-neutral-500">
                  Connect with {data.first_name} through The Niche Network.
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
