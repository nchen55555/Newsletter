'use client'
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import React from "react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
      <Navigation />
      <Container>
        <div className="max-w-3xl mx-auto py-16">
          {/* Overview */}
          <h1 className="text-4xl font-bold mb-4 text-neutral-800">
            coming soon...
          </h1>
          <p className="text-lg text-neutral-600 mb-10">
            <strong>the niche</strong> is a newsletter-turned-marketplace and <span className="relative group inline-block align-middle">
              <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                private invite-based community
              </span>
              <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                200 students from Harvard, MIT, Stanford, and Berkeley, hand-picked through academic and industry recommendations
              </span>
            </span>
            that partners with some of the highest-growth startups to connect them with the brightest students from top universities.
          </p>

          <p className="text-lg text-neutral-600 mb-10">
            <strong>populate your profile and connect with other students in your cohort </strong> (coming soon) 
          </p>
        </div>
      </Container>
    </div>
  );
}