"use client";
import { useEffect, useState } from "react";
import ProfileForm from "../components/profile_form";
import { Navigation } from "../components/header";
import { Container } from "../components/container";
import { Skeleton } from "@/components/ui/skeleton";

type ProfileData = {
    id: number,
    email: string;
    first_name: string;
    last_name: string;
    linkedin_url: string;
    resume_url: string;
    personal_website: string;
    phone_number: string;
    access_token: string;
  };

export default function Profile() {
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetch("/api/get_profile", { credentials: "include" })
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <Skeleton className="h-12 w-full" />; // or customize size;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <div className="pt-12 pb-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
        <Container><ProfileForm {...data} /></Container>
      </div>
    </div>
  );
}