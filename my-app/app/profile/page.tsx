"use client";
import { useEffect, useState } from "react";
import MultiStepProfileForm from "../components/multi_step_profile_form";
import { Navigation } from "../components/header";
import { Container } from "../components/container";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileData } from "@/app/types";
import { ExternalProfile } from "../components/external_profile";

export default function Profile() {
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetch("/api/get_profile", { credentials: "include" })
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <Skeleton className="h-12 w-full" />; // or customize size;

  // If user hasn't applied yet, show the form only
  // if (!data.applied) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
        <Navigation />
        <div className="pt-12 pb-8 px-6 relative">
          <div className="absolute inset-0 pointer-events-none"></div>
          <Container className="max-w-4xl mx-auto">
            {!data.applied && <MultiStepProfileForm {...data} />}
            {data.applied && <ExternalProfile {...data} />}
          
          </Container>
        </div>
      </div>
    );
  // }

}