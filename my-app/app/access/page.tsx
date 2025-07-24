'use client'

import { Navigation } from "../components/header";
import { Container } from "../components/container";
import { Subscribe } from "../components/subscribe";

export default function Access(){
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white"> 
              <Navigation />
              <div className="pt-24 pb-16 relative min-h-[80vh] flex items-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
                <Container>
                  <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-6xl font-medium tracking-tight mb-8 relative inline-block">
                      <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-neutral-950 via-neutral-800 to-neutral-600 animate-gradient">
                        the nic(h)e list
                      </span>
                      <span className="absolute inset-0 bg-yellow-200/50 -rotate-1 rounded-lg transform -skew-x-6" />
                    </h1>
                    <p className="text-xl text-neutral-600 mb-12">the marketplace-turned-newsletter for you to shop the startups you want to join</p>
                    <div className="flex justify-center">
                      <Subscribe />
                    </div>
                  </div>  
                </Container>
            </div>
        </div>
    );
}
