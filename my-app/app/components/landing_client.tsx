"use client";
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Subscribe } from "@/app/components/subscribe";
import { useSubscriptionContext } from './subscription_context';
import FrontProfile from './frontprofile';
import { Send, MessageSquareShare, CalendarPlus} from "lucide-react";
import { LandingPageSearch } from './landing-page-search';
import { SidebarLayout } from "./sidebar-layout";
import { Navigation } from "./header";
import { useMemo } from 'react';
import { ConnectionData, CompanyWithImageUrl, CompanyData } from "@/app/types";
import { ProfessionalReputationCard } from "./professional_reputation_card";
import { ConnectionBreakdownChart } from "./connection-breakdown-chart";
import { CompanyCard } from "../companies/company-cards";
import { type NetworkCompanies } from "@/app/opportunities/opportunities_fetch_information";

interface LandingClientProps {
  children?: React.ReactNode;
  dummyConnections?: ConnectionData[];
  dummyCompanies?: CompanyWithImageUrl[];
  dummyNetworkCompanies?: Map<number, NetworkCompanies>;
  opportunities?: CompanyData[];
}

export default function LandingClient({ children, dummyConnections = [], dummyCompanies = [], dummyNetworkCompanies, opportunities = [] }: LandingClientProps) {
  const { isSubscribed } = useSubscriptionContext();

  // Typewriter for the third line of the hero headline
  const heroWords = useMemo(() => ["Inner Circle", "Network", "of Engineers", "of Colleagues", "of Co-Founders"], []);
  const [wordIndex, setWordIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [howMode, setHowMode] = useState<"network" | "hiring">("network");
  const [activeStep, setActiveStep] = useState(0);
  const [isHowSectionInView, setIsHowSectionInView] = useState(false);
  const howStepsRef = useRef<HTMLDivElement | null>(null);

  const howSteps = [
    {
      title: "Personalize Your Professional Identity",
      body:
        "Curate your professional identity, customizing your projects, interests, experiences, timelines, and achievements as well as the opportunities you are interested in.",
      videoSrc: "/videos/profile-zoom.mp4",
    },
    {
      title: "Curate Your Network",
      body:
        "Build connections intentionally, and contextualize each relationship. Your network powers intelligence on The Niche to surface the best opportunities verified by your most trusted professional circles.",
      videoSrc: "/videos/connect-zoom.mp4",
    },
    {
      title: "Take Advantage of Your Personalized Opportunities Database",
      body:
        "When you're ready, tap into a verified network of warm intros to opportunities that fit your interests, anchored in real relationships.",
      videoSrc: "/videos/opportunities-zoom.mp4",
    },
  ];

  const stepDurationsMs = [8000, 12000, 15000];

  useEffect(() => {
    if (!heroWords.length) return;

    const currentWord = heroWords[wordIndex];

    // Shorter pause at full word before deleting
    if (!isDeleting && subIndex === currentWord.length) {
      const timeout = setTimeout(() => setIsDeleting(true), 700);
      return () => clearTimeout(timeout);
    }

    // When deleting and done, move to next word
    if (isDeleting && subIndex === 0) {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % heroWords.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, isDeleting ? 50 : 90);

    return () => clearTimeout(timeout);
  }, [subIndex, isDeleting, wordIndex, heroWords]);

  // Observe when the "How The Niche Works" steps are in view
  useEffect(() => {
    if (!howStepsRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsHowSectionInView(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    observer.observe(howStepsRef.current);

    return () => observer.disconnect();
  }, []);

  // Auto-advance steps while section is in view
  useEffect(() => {
    if (!isHowSectionInView) return;

    const timeout = setTimeout(() => {
      setActiveStep((prev) => (prev + 1) % howSteps.length);
    }, stepDurationsMs[activeStep] ?? 8000);

    return () => clearTimeout(timeout);
  }, [activeStep, isHowSectionInView, howSteps.length]);

  const typedHeroWord = heroWords[wordIndex]?.substring(0, subIndex) ?? "";
  const displayedHeroWord = typedHeroWord || "\u00A0";

  const landingPage = (
    <div>
      {/* Top Hero: text + CTAs */}
      <section className="px-4 pt-16 pb-8">
        <div className="mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Opportunities <br></br>from Your Niche
              <br></br>
              <span className="whitespace-nowrap bg-gradient-to-r from-purple-200 via-blue-100 to-purple-300 bg-clip-text text-transparent">
                {" "}
                {displayedHeroWord}
              </span>{" "}
            </h1>

            <p className="text-lg leading-relaxed max-w-7xl mx-auto bg-gradient-to-r from-purple-300 via-blue-100 to-purple-300 bg-clip-text text-transparent">
              <b>Warm introductions to opportunities your network has already validated.</b>
            </p>
            
            <p className="text-lg leading-relaxed max-w-4xl mx-auto">
              Curate the real relationships behind your career on The Niche to discover opportunities your most trusted circles are looking at or have already validated. Unlock warm introductions through our network-driven partnerships directly to the founders of those opportunities.
            </p>

            {/* Global search bar for people on The Niche */}
            <LandingPageSearch isSubscribed={isSubscribed} opportunities={opportunities} />

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              {/* Primary CTA */}
              <Subscribe />
              {/* Secondary CTA: scroll to "How The Niche Works" section */}
              <Button
                variant="outline"
                className="h-14 px-8 text-lg rounded-lg border-neutral-300 hover:border-white hover:text-white"
                onClick={() => {
                  const section = document.getElementById("how-the-niche-works");
                  if (section) {
                    section.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              >
            how the niche works              
            </Button>
            </div>
          </motion.div>
        </div>
        <div className="hidden lg:flex items-center justify-center mt-8">
          {/* Taller fixed-height row so top/mid/bottom staggering is more pronounced */}
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex h-74 items-stretch justify-between">
            {/* Top-aligned */}
            <div className="flex flex-col justify-start h-full">
              <FrontProfile 
                profileImage="https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/avatar_profiles/wellington-ferreira-72TE8cWKXRY-unsplash.jpg"
                name="Nicole"
                message="Michael Shared a Company Profile with Amber"
                icon={<MessageSquareShare className="h-4 w-4" />}
                messageSide="right"
              />
            </div>
            {/* Middle-aligned */}
            <div className="flex flex-col justify-center h-full">
              <FrontProfile 
                profileImage="https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/avatar_profiles/aiony-haust-3TLl_97HNJo-unsplash.jpg"
                name="Amber"
                message={`Browserbase Scheduled a Call with Abby`}
                icon={<CalendarPlus className="h-4 w-4" />}
                messageSide="left"
              />
            </div>
            {/* Bottom-aligned */}
            <div className="flex flex-col justify-end h-full">
              <FrontProfile 
                profileImage="https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/avatar_profiles/nicolas-horn-MTZTGvDsHFY-unsplash.jpg"
                name="Dylan"
                message="Tommy Contextualized His Connection with Michael"
                icon={<Send className="h-4 w-4" />}
                messageSide="left"
              />
            </div>
            {/* Middle-aligned again for 4th profile */}
            <div className="flex flex-col justify-center h-full">
              <FrontProfile 
                profileImage="https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/avatar_profiles/smiling-young-redhead-ginger-girl-with-freckles-isolated-olive-green-wall-with-copy-space.jpg"
                name="Dylan"
                message="Kate Updated Her Profile with New Projects"
                icon={<Send className="h-4 w-4" />}
                messageSide="left"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Company collage section - Desktop only, directly under hero CTAs */}
      

      {/* Section 2: How The Niche Works */}
      <section
        id="how-the-niche-works"
        className="py-20 px-4 sm:px-6 lg:px-8"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-center">
            How the Niche Works
          </h1>

          {/* Tab Structure */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-full border border-border p-1 bg-muted/50">
              <button
                type="button"
                onClick={() => setHowMode("network")}
                className={`h-12 px-6 md:px-8 text-sm md:text-base rounded-full font-medium transition-all ${
                  howMode === "network"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Your Niche Network
              </button>
              <button
                type="button"
                onClick={() => setHowMode("hiring")}
                className={`h-12 px-6 md:px-8 text-sm md:text-base rounded-full font-medium transition-all ${
                  howMode === "hiring"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Hire Through The Niche Network
              </button>
            </div>
          </div>

          {howMode === "network" && (
            <p className="text-base md:text-lg text-neutral-200 leading-relaxed max-w-5xl mx-auto text-center mt-8">
              <p className="text-lg leading-relaxed max-w-7xl mx-auto bg-gradient-to-r from-purple-300 via-blue-100 to-purple-300 bg-clip-text text-transparent">
                <b>The best opportunities have always been through word-of-mouth from your network - we&apos;re just digitalizing it.</b>
              </p>
              <br></br>
              By mapping the real people backing your career, contextualized through your own words, The Niche surfaces opportunities that your most trusted networks are already looking at or vetted. Curate a network of only your most trusted professional contacts. 
            </p>
          )}
      
          {howMode === "hiring" && (
              <div className="flex flex-col items-center gap-4 mt-8">
                <p className="text-base md:text-lg text-neutral-200 leading-relaxed max-w-5xl text-center">
              <p className="text-lg leading-relaxed max-w-7xl mx-auto bg-gradient-to-r from-purple-300 via-blue-100 to-purple-300 bg-clip-text text-transparent">
                <b>The best hires have always been through word-of-mouth from your network - we&apos;re just digitalizing it.</b>
              </p>
              <br></br>
              As a company, plug into a context-rich, verified network of high-performing early technical talent.
            </p>
                <Button
                  asChild
                  className="h-12 px-8 text-lg rounded-lg bg-primary text-primary-foreground"
                >
                  <Link
                    href="/hiring"
                  >
                    schedule a call
                  </Link>
                </Button>
              </div>
            )}
          
          {/* Network Visualizations and Company Cards */}
            <div ref={howStepsRef} className="mt-12 space-y-16 max-w-5xl mx-auto">
              {/* Section 1: Network Visualizations */}
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-semibold text-right px-6">
                  Insights and Warm Intros to Opportunities in Your Network
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dummyCompanies.map((company) => (
                    <CompanyCard
                      key={company._id}
                      company={company}
                      disableNavigation={true}
                      network_connections={dummyNetworkCompanies?.get(company.company)}
                    />
                  ))}
                </div>
               
              </div>

              {/* Section 2: Company Opportunities */}
              <div className="space-y-6">
                <h6 className="text-2xl md:text-3xl font-semibold text-left px-6">
                  Insights About Your Reputation Within Your Network
                </h6>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1">
                    <ConnectionBreakdownChart connections={dummyConnections} />
                  </div>
                  <div className="lg:col-span-3">
                    <ProfessionalReputationCard connections={dummyConnections} />
                  </div>
                </div>
                {/* Step indicators */}
                
              </div>
            </div>
        </div>
      </section>
    </div>
  )


  return (
    <>
    {isSubscribed ? (
      <SidebarLayout defaultOpen={false}>
        {landingPage}
        {children}
      </SidebarLayout>
    ) : (
      <>
       <Navigation isLandingPage={true} />
          {landingPage}
          {children}
      </>
    )}
    </>
  );
}