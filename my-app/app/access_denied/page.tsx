import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";

export default function AccessDeniedPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
            <Navigation />
            <Container>
                <div className="pt-12 pb-16 relative text-2xl leading-relaxed">
                    <p className="text-neutral-600 mb-6">
                        Thank you for your interest! This platform is <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300 cursor-pointer">
                                invite-only
                            </span>
                            <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                                exclusive opportunities to connect with our startups, read our company profiles, and connect with others on the platform
                            </span>.
                        You&#39;ll receive an invite to access the platform if referred.
                    </p>
                    <p className="text-neutral-600 mb-6">
                        If you&#39;re interested in being a part of the cohort, feel free to 
                        <span className="relative group inline-block align-middle ml-2">
                            <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300 cursor-pointer">
                                reach out
                            </span>
                            <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                                nicole_chen@college.harvard.edu
                            </span>
                        </span>! We&#39;d love to connect and learn more about you
                    </p>
                    <p className="text-neutral-600 mt-8 text-base">
                        We hand-pick our cohort from top universities and through industry recommendations. If you&#39;re passionate about startups and want to be part of the niche, don&#39;t hesitate to reach out.
                    </p>
                </div>
            </Container>
        </div>
    );
}