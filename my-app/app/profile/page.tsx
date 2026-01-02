"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MultiStepProfileForm from "../components/multi_step_profile_form";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileData } from "@/app/types";
import { PersonalProfile } from "../components/personal_profile";
import { ProtectedContent } from "../components/protected-content";

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

  if (!data) return <Skeleton className="h-12 w-full" />; // or customize size;

  const shouldShowForm = isOnboardingFlow;

  // If user hasn't applied yet, show the form only
  // if (!data.applied) {
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