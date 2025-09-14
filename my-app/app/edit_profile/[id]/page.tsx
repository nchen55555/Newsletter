"use client";
import { useEffect, useState } from "react";
import { Navigation } from "../../components/header";
import { Container } from "../../components/container";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileData } from "@/app/types";
import MultiStepProfileForm from "@/app/components/multi_step_profile_form";

export default function ExternalProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setProfileId(id);
      
      // Fetch profile data using the new external profile API
      const apiUrl = `/api/get_profile`;
      
      fetch(apiUrl, { credentials: "include" })
        .then(res => {
          return res.json();
        })
        .then(data => {
          setData(data);
        })
        .catch(error => {
          setData(null);  
          throw new error
        });
    };
    
    getParams();
  }, [params]);

  if (!data || !profileId) return <Skeleton className="h-12 w-full" />

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <div className="pt-12 pb-8 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
        <Container className="max-w-4xl mx-auto">
        <MultiStepProfileForm {...data} />
        </Container>
      </div>
    </div>
  );
}