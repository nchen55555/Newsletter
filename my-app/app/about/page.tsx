'use client'
import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import RainbowNetwork from "@/app/components/rainbow_graph";
import { motion } from 'framer-motion';
import React from "react";


export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
      <Navigation />
      <Container>      
        <div className="flex flex-1 flex-col lg:flex-row w-full max-w-[1400px] px-8 mx-auto py-12 gap-16 items-center min-h-screen">
          {/* Left side - Text content */}
          <div className="flex-[3] flex flex-col justify-center px-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            >
              <h1 className="text-2xl md:text-4xl font-bold mb-8 text-neutral-800 leading-relaxed">
                Personalizing and Verifying Your Network
              </h1>
              <p className="text-base md:text-lg text-neutral-600 mb-12 leading-relaxed">
                Indexing on skills, networks, and interests to personalize the opportunities that come your way, matching you 
                with unparalleled accuracy to an exclusive cohort of people and companies 
              </p>
              
              <div className="space-y-8">
                <h2 className="text-lg md:text-xl font-semibold text-neutral-800 mb-6">How do we do this?</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="font-medium text-neutral-800">Verification</h3>
                      <p className="text-sm text-neutral-600">We ingest verifiable data that you provide on your background</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="font-medium text-neutral-800">Personalization</h3>
                      <p className="text-sm text-neutral-600">You build your profile, indexing on your interests, competencies, and existing networks</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="font-medium text-neutral-800">Matching</h3>
                      <p className="text-sm text-neutral-600">We connect you to exclusive opportunities to founders, investors, and startups, indexing on verifiable and personalized data that you curated and that we built out </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Right side - Large Rainbow Network */}
          <div className="flex-[3] relative w-full h-[800px] flex items-center justify-center perspective-[1000px]">
            <motion.div
              className="w-full h-full"
              animate={{
                rotateY: [0, 15, -15, 0],
                rotateX: [0, 10, -10, 0],
              }}
              transition={{
                duration: 8,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              }}
              style={{
                transformStyle: "preserve-3d"
              }}
            >
              <RainbowNetwork
                nodeCount={20}
                avgDegree={3}
                seedEveryMs={1000}
                className="w-full h-full"
              />
            </motion.div>
          </div>
        </div>   
      </Container>
    </div>
  );
}