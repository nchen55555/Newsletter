
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import { ProfileData } from "@/app/types";
import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";

// Mock profile data (same as in people page)
const mockProfiles: ProfileData[] = [
  {
    id: 1,
    email: "sarah.chen@harvard.edu",
    first_name: "Sarah",
    last_name: "Chen",
    linkedin_url: "https://linkedin.com/in/sarahchen",
    resume_url: "",
    personal_website: "https://sarahchen.dev",
    phone_number: "555-0101",
    access_token: "",
    profile_image_url: "https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/profile_image_files/44e8c029-9c10-40f3-aba2-b359ef9985a1/profile_image-1755900890621-profile_image-1755266278419-profile_image-1755217477839-IMG_7838.jpeg",
    bio: "CS major at Harvard with a passion for AI and machine learning. Previously interned at Google and looking for opportunities in tech startups.",
    is_public_profile: true,
    newsletter_opt_in: true,
  },
  {
    id: 2,
    email: "alex.rodriguez@mit.edu",
    first_name: "Alex",
    last_name: "Rodriguez",
    linkedin_url: "https://linkedin.com/in/alexrodriguez",
    resume_url: "",
    personal_website: "",
    phone_number: "555-0102",
    access_token: "",
    profile_image_url: "https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/profile_image_files/44e8c029-9c10-40f3-aba2-b359ef9985a1/profile_image-1755900890621-profile_image-1755266278419-profile_image-1755217477839-IMG_7838.jpeg",
    bio: "Mechanical Engineering student at MIT with experience in robotics and automation. Interested in hardware startups and IoT solutions.",
    is_public_profile: true,
    newsletter_opt_in: false,
  },
  {
    id: 3,
    email: "emily.wang@stanford.edu",
    first_name: "Emily",
    last_name: "Wang",
    linkedin_url: "https://linkedin.com/in/emilywang",
    resume_url: "",
    personal_website: "https://emilywang.com",
    phone_number: "555-0103",
    access_token: "",
    profile_image_url: "https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/profile_image_files/44e8c029-9c10-40f3-aba2-b359ef9985a1/profile_image-1755900890621-profile_image-1755266278419-profile_image-1755217477839-IMG_7838.jpeg",
    bio: "Product Management student at Stanford GSB. Previously worked at Meta and passionate about consumer tech and social impact startups.",
    is_public_profile: true,
    newsletter_opt_in: true,
  },
  {
    id: 4,
    email: "james.kim@berkeley.edu",
    first_name: "James",
    last_name: "Kim",
    linkedin_url: "https://linkedin.com/in/jameskim",
    resume_url: "",
    personal_website: "",
    phone_number: "555-0104",
    access_token: "",
    profile_image_url: "https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/profile_image_files/44e8c029-9c10-40f3-aba2-b359ef9985a1/profile_image-1755900890621-profile_image-1755266278419-profile_image-1755217477839-IMG_7838.jpeg",
    bio: "Data Science major at UC Berkeley with expertise in machine learning and analytics. Looking to join early-stage fintech or healthtech startups.",
    is_public_profile: true,
    newsletter_opt_in: true,
  },
  {
    id: 5,
    email: "maya.patel@harvard.edu",
    first_name: "Maya",
    last_name: "Patel",
    linkedin_url: "https://linkedin.com/in/mayapatel",
    resume_url: "",
    personal_website: "https://mayapatel.design",
    phone_number: "555-0105",
    access_token: "",
    profile_image_url: "https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/profile_image_files/44e8c029-9c10-40f3-aba2-b359ef9985a1/profile_image-1755900890621-profile_image-1755266278419-profile_image-1755217477839-IMG_7838.jpeg",
    bio: "Design and Computer Science double major at Harvard. UX/UI designer with experience at Airbnb. Passionate about design systems and accessibility.",
    is_public_profile: true,
    newsletter_opt_in: false,
  },
  {
    id: 6,
    email: "david.thompson@mit.edu",
    first_name: "David",
    last_name: "Thompson",
    linkedin_url: "https://linkedin.com/in/davidthompson",
    resume_url: "",
    personal_website: "",
    phone_number: "555-0106",
    access_token: "",
    profile_image_url: "https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/profile_image_files/44e8c029-9c10-40f3-aba2-b359ef9985a1/profile_image-1755900890621-profile_image-1755266278419-profile_image-1755217477839-IMG_7838.jpeg",
    bio: "Electrical Engineering and Computer Science at MIT. Full-stack developer with internships at Tesla and SpaceX. Interested in cleantech and space technology.",
    is_public_profile: true,
    newsletter_opt_in: true,
  },
];

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = parseInt(id);
  const profile = mockProfiles.find(p => p.id === profileId);

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
      <Navigation />
      <Container>
        <div className="max-w-4xl mx-auto py-8 md:py-16 px-4 md:px-6">


          <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 px-8 py-12">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Profile Image */}
                <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-lg flex-shrink-0">
                  {profile.profile_image_url ? (
                    <Image
                      src={profile.profile_image_url}
                      alt={`${profile.first_name} ${profile.last_name}`}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-3xl">
                      {profile.first_name[0]}{profile.last_name[0]}
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <a
                      href={`mailto:${profile.email}`}
                      className="inline-flex items-center justify-center bg-neutral-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Email
                    </a>
                    {profile.personal_website && (
                      <a
                        href={profile.personal_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center bg-neutral-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Personal Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="px-8 py-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">About</h2>
              <p className="text-lg text-neutral-700 leading-relaxed">
                {profile.bio}
              </p>
            </div>

            {/* Contact Section */}
            <div className="px-8 py-6 bg-neutral-50 border-t border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Get in Touch</h3>
              <p className="text-neutral-600 mb-3">
                Interested in connecting with {profile.first_name}? Reach out via email to start the conversation.
              </p>
              <p className="text-neutral-700 font-medium">
                {profile.email}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
