import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";
import { ExternalLink } from "@/app/components/external_link";

export default function ClientsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
      <Navigation />
      <Container>
        <div className="max-w-4xl mx-auto py-16">
          <h1 className="text-4xl font-bold mb-8 text-neutral-800">
            membership and pricing
          </h1>
          <p className="text-lg text-neutral-600 mb-10">
            the niche isn&apos;t just a newsletter but rather <strong>a direct inbound into your hiring pipeline for early talent</strong> 
          </p>
          <div className="mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 w-full">
              <h2 className="text-3xl font-bold mb-4 text-neutral-800">
                <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-3 py-2 rounded inline-block">
                  for startups
                </span>
              </h2>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-bold text-neutral-800">$200</span>
                <span className="text-neutral-500 text-lg">per year</span>
                <span className="inline-block bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-3 py-1 rounded text-neutral-700 text-base font-semibold">+ 5% per extended hire</span>
              </div>
              <div className="text-neutral-600 text-base mb-4 mt-2">annual membership fee - outbound that notifies the cohort directly, an exclusive company profile with enhanced visibility, direct connects to interested students, and enhanced screening supplemented with your requested candidate information <br /> success-based fee only applies if you extend an offer to a candidate connected through the niche</div>
              <div className="text-sm text-neutral-500 mb-4">
                <strong>note:</strong> we charge an annual fee to ensure buy-in from our partner startups, guaranteeing that our partners would actively engage with the students we refer over
              </div>
              <ul className="space-y-2 text-neutral-700 text-base mt-6">
  <li className="flex items-start gap-2">
    <span className="mt-1">
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </span>
    <span>exclusive access to a cohort of 200 of the best student talent already filtered by academic strength, work experience, and entrepreneurial initiative</span>
  </li>
  <li className="flex items-start gap-2">
    <span className="mt-1">
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </span>
    <span>custom write-up about your product, team, hiring needs, etc. in our company profiles (media)</span>
  </li>
  <li className="flex items-start gap-2">
    <span className="mt-1">
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </span>
    <span>targeted outbound to students by interest and fit</span>
  </li>
  <li className="flex items-start gap-2">
    <span className="mt-1">
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </span>
    <span>pre-screened candidates, supplemented with all the information you need</span>
  </li>
  <li className="flex items-start gap-2">
    <span className="mt-1">
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </span>
    <span>direct introductions to candidates that have already prefaced their interest in your company</span>
  </li>
  <li className="flex items-start gap-2">
    <span className="mt-1">
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </span>
    <span>immediate brand-building among top student talent</span>
  </li>
</ul>
            </div>
          </div>
          <div className="mt-12">
  <h2 className="text-2xl font-semibold mb-2 text-neutral-800">next steps</h2>
            <ol className="list-decimal ml-6 text-lg text-neutral-700 space-y-2">
              <li><strong>hop on a call with us to preserve your spot as a member and to get any questions clarified. Click <ExternalLink href="https://calendly.com/nicole_chen/an-intro-to-the-niche">here</ExternalLink></strong>.  we will use this time to get a better understanding of your needs and ask some direct questions to curate the company profile!</li>
              <li>each issue takes 1-2 weeks to launch. we will onboard you and start matching candidates directly once launched!</li>
              <li>pay the subscription fee here <ExternalLink href="https://buy.stripe.com/00w5kE4UI1Ue5SW1iFaVa00">here</ExternalLink></li>
            </ol>
          </div>
        </div>
      </Container>
    </div>
  );
}
