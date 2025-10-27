"use client";
import { useEffect, useState } from "react";
import { Navigation } from "../../components/header";
import { Container } from "../../components/container";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileData } from "@/app/types";
import { decodeSimple } from "@/app/utils/simple-hash";
import { ExternalProfile } from "../../components/external_profile";

export default function ExternalProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getParams = async () => {
      try {
        const { id } = await params;
        
        // Decode the hashed ID to get the real database ID
        const realId = decodeSimple(id);
        if (!realId) {
          console.error('Invalid profile ID format:', id);
          setError('Invalid profile link');
          setData(null);
          return;
        }
        
        // Fetch profile data using the external profile API with the hashed ID
        const apiUrl = `/api/get_external_profile?id=${id}`;
        
        const res = await fetch(apiUrl);
        if (res.ok) {
          const profileData = await res.json();
          setData(profileData);
        } else {
          setError('Profile not found');
          setData(null);
        }
      } catch (error) {
        setError('Failed to load profile');
        setData(null);
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getParams();
  }, [params]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
        <Navigation />
        <div className="pt-12 pb-8 px-6 relative">
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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
        <Navigation />
        <div className="pt-12 pb-8 px-6 relative">
          <Container className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Profile Not Found</h1>
              <p className="text-neutral-600">{error || 'The profile you\'re looking for doesn\'t exist or isn\'t available.'}</p>
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
          <ExternalProfile {...data} isExternalView={true} />
        </Container>
      </div>
    </div>
  );
}