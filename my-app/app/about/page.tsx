'use client'
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import { ExternalLink } from "@/app/components/external_link";

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
            <strong>the niche</strong> is a newsletter-turned-marketplace and <span className="relative group inline-block align-middle">
              <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                private invite-based community
              </span>
              <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                100 students from Harvard, MIT, Stanford, and Berkeley, hand-picked through academic and industry recommendations
              </span>
            </span>
            that partners with some of the highest-growth startups to connect them with the brightest students from top universities.
          </p>

          <p className="text-lg text-neutral-600 mb-10">
            <strong>we start with a simple statement</strong> talent discovery amongst emerging startups has always been challenging. ironically, early talent is often keen on taking on more entrepreneurial pathways, but struggle to find the <span className="relative group inline-block align-middle">
              <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                right opportunities at the right time.
              </span>
              <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                Cursor back in 2022
              </span>
            </span>
          </p>

          <p className="text-lg text-neutral-600 mb-10">
            in a world of <strong>increasingly ambiguous landing pages</strong> powered by <span className="relative group inline-block align-middle">
              <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                VC buzzwords
              </span>
              <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                B2B Consumer AI SaaS
              </span>
            </span> and AI-generated content, understanding what the startup does and betting on their trajectory is proving more and more difficult.
          </p>
          <p className="text-lg text-neutral-600 mb-10">
            <strong>that is what the niche is here to solve</strong>
          </p>
          <div className="mt-12 mb-10">
            <Accordion title="the marketplace">
              <ul className="space-y-4 text-neutral-700 text-lg mt-4">
                <li><strong>our cohort</strong> invite-only, must opt-in to indicate active interest and involvement, hand-picked from Harvard, MIT, Berkeley, and Stanford based on academic excellence, work experience, and entrepreneurial drive</li>
                <li><strong>our partners</strong> Series A-D, high-growth companies committed to hiring and discovering the next generation of early talent</li>
              </ul>
            </Accordion>
          </div>
          <div className="mt-12 mb-10">
            <Accordion title="how it works">
              <ul className="space-y-4 text-neutral-700 text-lg mt-4">
                <li><strong>each week</strong> we drop a <span className="relative group inline-block align-middle">
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

// Accordion dropdown component
function Accordion({ title, children }: { title: string, children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button
        className="flex items-center w-full text-left text-2xl font-semibold text-neutral-800 focus:outline-none"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="accordion-content"
        type="button"
      >
        <span className="flex-1">{title}</span>
        <svg
          className={`w-6 h-6 ml-2 transform transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {open && (
        <div id="accordion-content" className="mt-2">
          {children}
        </div>
      )}
    </div>
  );
}