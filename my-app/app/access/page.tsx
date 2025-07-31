'use client'

import { Navigation } from "../components/header";
import { Subscribe } from "../components/subscribe";

export default function Access() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <div className="w-full max-w-2xl mx-auto py-20 px-8 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="relative rounded-xl overflow-hidden w-full text-center">
          
          <h1 className="text-6xl font-medium tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-neutral-950 via-neutral-800 to-neutral-600 animate-gradient">
            the nic(h)e list
          </h1>
          <div className="flex justify-center">
            <Subscribe />
          </div>
        </div>
      </div>
    </div>
  );
}
