"use client";
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Subscribe } from "@/app/components/subscribe";
import { useSubscriptionContext } from './subscription_context';
import FrontProfile from './frontprofile';
import { Send, MessageSquareShare, CalendarPlus} from "lucide-react";
import { LandingPageSearch } from './landing-page-search';
import { SidebarLayout } from "./sidebar-layout";
import { Navigation } from "./header";
import { useMemo } from 'react';

export default function LandingClient({ children }: { children?: React.ReactNode }) {
  const { isSubscribed } = useSubscriptionContext();

  // Typewriter for the third line of the hero headline
  const heroWords = useMemo(() => ["of Opportunities", "Network", "of Engineers", "of Colleagues", "of Founders"], []);
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
    }, isDeleting ? 40 : 70);

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
              Discover Your Niche
              <br />
              <span className="inline-block w-[18ch] whitespace-nowrap bg-gradient-to-r from-purple-200 via-blue-100 to-purple-300 bg-clip-text text-transparent">
                {typedHeroWord}
              </span>
            </h1>
            
            <p className="text-lg leading-relaxed max-w-7xl mx-auto">
              Curate your personalized, verified professional network by adding context to each connection, digitizing the real relationships behind your career. Discover opportunities that your most trusted circles are already looking at or have vetted directly on the Niche through our network-driven warm introductions.
            </p>

            {/* Global search bar for people on The Niche */}
            <LandingPageSearch isSubscribed={isSubscribed} />

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
                message="Tommy Verified His Connection with Michael"
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
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4">
            How the Niche Works
            </h1>
          <p className="text-base md:text-lg text-neutral-200 leading-relaxed">
            The best opportunities have always been through word-of-mouth from your network - we&apos;re just digitalizing it. By mapping the true network of the people backing your career, contextualized through your own words, The Niche surfaces opportunities that your most trusted networks are already looking at or vetted. If your network signals a strong fit to one of our partner startups, we can facilitate a warm introduction to the founders for you on your behalf.
          </p>

          {/* Mode toggle: For building your network / For hiring */}
          <div className="mt-10 flex justify-center">
            <div className="inline-flex rounded-full border border-border p-1">
              <button
                type="button"
                onClick={() => setHowMode("network")}
                className={`h-12 px-8 text-base md:text-lg rounded-full font-medium transition-all ${
                  howMode === "network"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Build Your Niche Network
              </button>
              <button
                type="button"
                onClick={() => setHowMode("hiring")}
                className={`h-12 px-8 text-base md:text-lg rounded-full font-medium transition-all ${
                  howMode === "hiring"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Hire From The Niche Network
              </button>
        </div>
      </div>

          {/* Copy that changes with mode – brief summary above the step-by-step flow */}
          <div className="mt-8 text-sm md:text-base text-neutral-200 leading-relaxed min-h-[96px] md:min-h-[72px] flex flex-col items-center justify-center gap-4">
            {howMode === "network" ? (
              <p className="text-center">
                Use The Niche to build a verified, context-rich network: curate a highly personalized portfolio of your professional identity, curate your verified network of connections, and unlock warm introductions powered the intelligence from your digitalized professional network.
              </p>
            ) : (
              <>
                <p className="text-center pb-4">
                  As a company, plug into a context-rich, verified network of high-performing early technical talent.
                </p>
                <Button
                  asChild
                  className="h-12 px-8 text-lg rounded-lg bg-primary text-primary-foreground"
                >
                  <a
                    href="https://calendly.com/nicole_chen/an-intro-to-the-niche"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Schedule a call
                  </a>
                </Button>
              </>
            )}
          </div>
          
          {/* Auto-advancing 3-step flow: one step visible at a time, below the summary text */}
          {howMode === "network" && (
            <div ref={howStepsRef} className="mt-12 space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-12">
                {/* Video / animation side */}
                <div className="w-full md:w-7/12">
                  <div className="w-full h-80 md:h-[24rem] rounded-3xl overflow-hidden bg-black shadow-inner">
                    {howSteps[activeStep].videoSrc ? (
                      <video
                        key={howSteps[activeStep].videoSrc}
                        className="w-full h-full object-cover transform scale-[1.2]"
                        autoPlay
                        loop
                        muted
                        playsInline
                      >
                        <source src={howSteps[activeStep].videoSrc as string} type="video/mp4" />
                      </video>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-emerald-200 via-cyan-200 to-indigo-200 flex items-center justify-center">
                        <span className="text-sm md:text-base text-neutral-200 px-6 text-center">
                          Your network routes warm introductions to the right people.
                        </span>
                          </div>
                        )}
                        </div>
                      </div>

                {/* Text side */}
                <div className="w-full md:w-5/12 text-left">
                  <h4 className="text-lg md:text-xl font-semibold text-neutral-200 mb-2">
                    {howSteps[activeStep].title}
                  </h4>
                  <p className="text-xs md:text-sm text-neutral-300">
                    {howSteps[activeStep].body}
                  </p>
                </div>
              </div>

              {/* Step indicators / manual controls */}
              <div className="flex justify-center gap-2 mt-4">
                {howSteps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className={`h-2.5 rounded-full transition-all ${
                      activeStep === idx ? "w-8 bg-neutral-900" : "w-2.5 bg-neutral-300"
                    }`}
                    aria-label={`Go to step ${idx + 1}`}
                  />
              ))}
            </div>
          </div>
          )}
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