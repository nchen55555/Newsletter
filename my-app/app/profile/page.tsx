"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MultiStepProfileForm from "../components/multi_step_profile_form";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileData } from "@/app/types";
import { PersonalProfile } from "../components/personal_profile";
import { ProtectedContent } from "../components/protected-content";
import { SidebarLayout } from "../components/sidebar-layout";
import { Container } from "../components/container";

function ProfileContent() {
  const [data, setData] = useState<ProfileData | null>(null);
  const searchParams = useSearchParams();
  const flow = searchParams.get("flow");
  const isOnboardingFlow = flow === "onboarding";

  const fetchProfileData = async () => {
    try {
      const res = await fetch("/api/get_profile", { credentials: "include" });
      const profileData = await res.json();
      setData(profileData);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);


  const shouldShowForm = isOnboardingFlow;

  if (!data) {
    return (
      <SidebarLayout title="Profile">
      <Container>
      <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mb-4"></div>
          <p className="text-sm font-medium text-neutral-700">Loading your profile</p>
      </div>
      </Container>
      </SidebarLayout>
    );
  }

  
    return (
      <ProtectedContent>
      {shouldShowForm ? (
        <MultiStepProfileForm {...data} />

      ) : (
        <PersonalProfile {...data} onRefresh={fetchProfileData} />
      )}
      </ProtectedContent>   
    );

}

export default function Profile() {
  return (
    <Suspense fallback={<Skeleton className="h-12 w-full" />}>
      <ProfileContent />
    </Suspense>
  );
}