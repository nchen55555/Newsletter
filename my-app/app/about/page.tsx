'use client'
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import { ExternalLink } from "@/app/components/external_link";
import { Accordion } from "@/app/components/accordion";
import React from "react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
      <Navigation />
      <Container>
        <div className="max-w-3xl mx-auto py-16">
          {/* Overview */}
          <h1 className="text-4xl font-bold mb-4 text-neutral-800">
            welcome to the niche
          </h1>
          <p className="text-lg text-neutral-600 mb-10">
            <strong>the niche</strong> is a newsletter-turned-marketplace
            that partners and reports on some of the highest-growth startups. We connect and match our partner startups with early talent, hand-picked and introduced by a <span className="relative group inline-block align-middle">
              <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                private invite-based community
              </span>
              <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                a referral-based network for those that want access to this beta
              </span>
            </span> through our personal network and a variety of industry-specific evaluations. 
          </p>

          <p className="text-lg text-neutral-600 mb-10">
            early talent is introduced via referral and in this public beta, can apply to join the network. our team is entirely technically and we screen the candidate. if there is a mutual fit, <strong>we send the candidate's profile to 2-3 of our partner startups and if they are interested in the candidate and think there could be a strong match, the candidate is introduced to the platform</strong>. this process allows us to index upon how we filter and match each candidate to our partner startups 
          </p>
          <p className="text-lg text-neutral-600 mb-10">
            <strong>we start with a simple statement</strong> talent matching and discovery is high-friction yet both sides of the marketplace are eager to connect.
          </p>
          <p className="text-lg text-neutral-600 mb-10">
            <strong>that is what the niche is here to solve</strong>
          </p>


          <div className="mt-12 mb-10">
            <Accordion title="the marketplace">
              <ul className="space-y-4 text-neutral-700 text-lg mt-4">
                <li><strong>our students</strong> are introduced invite-only with filters including an application and evaluations geared towards their specific skillset and background. our early talent must opt-in to indicate active interest and involvement</li>
                <li><strong>our partners</strong> Series A-D, high-growth companies committed to hiring and discovering the next generation of early talent</li>
              </ul>
            </Accordion>
          </div>
          <div className="mt-12 mb-10">
            <Accordion title="how it works">
              <ul className="space-y-4 text-neutral-700 text-lg mt-4">
                <li><strong>every 3-5 days</strong> we drop a <span className="relative group inline-block align-middle">
              <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                company profile
              </span>
              <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
              the profile dissects the startup&apos;s product, teams, and trajectory, diving deep into its strategy and growth.
              </span>
            </span> 
                with one of our partner startups. <strong>this is to ensure that our students have a clear understanding of the startup&apos;s value proposition and potential.</strong> for companies, that means we interview the founding team and work closely to get a clear vision of what they are looking for in their next hires. </li>
                <li>once the profile drops, <strong>students can bookmark the feature or directly apply </strong> by updating their profile with the necessary requirements (resume, transcript, background). the niche will do a quick screen of the candidate based on our partner company&apos;s preferences and directly connect/intro if there is a mutual fit!</li>
              </ul>
            </Accordion>
          </div>
          <div className="mt-12 mb-10">
            <Accordion title="interested in getting involved?">
              <ul className="space-y-4 text-neutral-700 text-lg mt-4">
                <li><strong>for students</strong> we are strictly invite and personal referral-based. if you are interested, feel free to <span className="relative group inline-block align-middle">
              <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                reach out
              </span>
              <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
              nicole_chen@college.harvard.edu
              </span>
            </span> 
                </li>
                <li><strong>for startups </strong> click on our{' '}
                  <ExternalLink href="/clients">client page</ExternalLink>{' '}to learn more!
                </li>
              </ul>
            </Accordion>
            </div>
        </div>
      </Container>
    </div>
  );
}