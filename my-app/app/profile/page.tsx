"use client";
import { useEffect, useState } from "react";
import MultiStepProfileForm from "../components/multi_step_profile_form";
import { Navigation } from "../components/header";
import { Container } from "../components/container";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileData } from "@/app/types";
import { ExternalProfile } from "../components/external_profile";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw } from "lucide-react";

export default function Profile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [activeView, setActiveView] = useState<'external' | 'form'>('external');

  useEffect(() => {
    fetch("/api/get_profile", { credentials: "include" })
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <Skeleton className="h-12 w-full" />; // or customize size;

  // If user hasn't applied yet, show the form only
  if (!data.applied) {
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

  // If user has applied, show sidebar navigation
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-pink-50 via-purple-50 via-blue-50 via-green-50 via-yellow-50 to-orange-50 border-r border-gray-200 shadow-sm pt-12">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Views</h2>
              <nav className="space-y-2">
                <Button
                  variant={activeView === 'external' ? 'default' : 'ghost'}
                  className={`w-full justify-start ${
                    activeView === 'external' 
                      ? 'bg-neutral-900 text-white hover:bg-neutral-800' 
                      : 'text-gray-700 hover:bg-white/70 backdrop-blur-sm'
                  }`}
                  onClick={() => setActiveView('external')}
                >
                  <Eye className="w-4 h-4 mr-3" />
                  External Profile
                </Button>
                <Button
                  variant={activeView === 'form' ? 'default' : 'ghost'}
                  className={`w-full justify-start ${
                    activeView === 'form' 
                      ? 'bg-neutral-900 text-white hover:bg-neutral-800' 
                      : 'text-gray-700 hover:bg-white/70 backdrop-blur-sm'
                  }`}
                  onClick={() => setActiveView('form')}
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resubmit Profile
                </Button> 
              </nav>
              
              {/* Profile Info */}
              <div className="mt-8 pt-6 border-t border-white/30">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {data.first_name} {data.last_name}
                    </p>
                    <p className="text-xs text-gray-600">{data.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto pt-12 pb-8 px-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
          <Container className="max-w-4xl mx-auto h-full">
            {activeView === 'external' && <ExternalProfile {...data} />}
            {activeView === 'form' && <MultiStepProfileForm {...data} />}
          </Container>
        </div>
      </div>
    </div>
  );
}