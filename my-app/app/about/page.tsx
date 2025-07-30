import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";

export default function ArticlePage() {
    return (
        
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
            <Navigation />
            <Container>
                <div className="pt-12 pb-16 relative text-2xl leading-relaxed">
                    <p className="text-neutral-600 mb-6"> <strong>welcome to the niche</strong></p> 
                    <p className="text-neutral-600 mb-6">
                the niche is a newsletter-turned-marketplace for
                <span className="relative group inline-block align-middle">
                    <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                    an exclusive cohort of students
                    </span>
                    <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                    100 students from Harvard, MIT, Stanford, and Berkeley, hand-picked through academic and industry recommendations
                    </span>
                </span>
                that we&apos;ve chosen
                </p>
                    <p className="text-neutral-600 mb-6"><strong>we start with a simple statement</strong></p> 
                    <p className="text-neutral-600 mb-6">discovering talent has always been a struggle amongst emerging startups and interested students. we only hear about companies like <span className="relative group inline-block align-middle">
                    <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                    Cursor
                    </span>
                    <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                    AI-code generation
                    </span>
                </span> only after they&#39;ve taken off</p>  
                    <p className="text-neutral-600 mb-6">in a world of increasingly ambiguous landing pages powered by <span className="relative group inline-block align-middle">
                    <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                    VC buzzwords
                    </span>
                    <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                    B2B Full Stack Consumer AI SaaS
                    </span>
                </span> words and AI-generated content, understanding what the startup does and betting on their trajectory is getting more and more difficult</p>
                    <p className="text-neutral-600 mb-6"> <strong>that is what the niche is here to solve</strong></p> 
                    <p>access to our platform and resources are available to our select cohort, but if you are interested in joining, feel free to 
  <span className="relative group inline-block align-middle">
    <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
      reach out
    </span>
    <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
      nicole_chen@college.harvard.edu
    </span>
  </span>!
</p>
                </div>
            </Container>
        </div>
    )
}