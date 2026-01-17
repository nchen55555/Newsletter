import { ArticleNewsfeed } from "@/app/components/article_mosaic";
import LandingClient from "./components/landing_client";
import { ConnectionData, CompanyWithImageUrl, CompanyData } from "@/app/types";
import { type NetworkCompanies } from "@/app/opportunities/opportunities_fetch_information";
import { client } from '@/lib/sanity/client';
import { COMPANIES_QUERY, CACHE_OPTIONS } from '@/lib/sanity/queries';

export default async function Home() {
  // Fetch opportunities data from Sanity
  const opportunities: CompanyData[] = await client.fetch(COMPANIES_QUERY, {}, CACHE_OPTIONS.COMPANIES);
  // Dummy connection data for network visualization
  const dummyConnections: ConnectionData[] = [
    {
      connect_id: 1,
      rating: 5,
      alignment_value: 4.0,
      note: "Interned together back sophomore year. Super strong technically and a great programmer in general."
    },
    {
      connect_id: 2,
      rating: 4,
      alignment_value: 4.0,
      note: "My college roommate. Worked together in several classes on different technical projects."
    },
    {
      connect_id: 3,
      rating: 4,
      alignment_value: 2.0,
      note: "Don't know too well but from what I have heard he's a great engineer with a strong reputation in college. Reputable internships as well. "
    },
    {
      connect_id: 4,
      rating: 3,
      alignment_value: 2.0,
      note: "Roommate in college. Otherwise, didn't really work with him that much."
    },
    {
      connect_id: 5,
      rating: 3,
      alignment_value: 3.0,
      note: "Went to a couple of hackathons together. Hard working but can definitely tell there is some inexperience with scaling systems. Not sure if I would co-found. "
    },
    {
      connect_id: 6,
      rating: 2,
      alignment_value: 3.0,
      note: "Connected at a networking event. Similar interests in AI research and AI Safety. "
    },
    {
      connect_id: 7,
      rating: 4,
      alignment_value: 4.0,
      note: "Worked together on a production ML system; consistently shipped high-quality code and mentored junior engineers."
    },
    {
      connect_id: 8,
      rating: 5,
      alignment_value: 5.0,
      note: "Closest collaborator from my last startup. Deep product intuition and very strong execution under pressure."
    },
    {
      connect_id: 9,
      rating: 3,
      alignment_value: 3.0,
      note: "Collaborated on a few open-source issues. Reliable and thoughtful in code reviews, still early in their career."
    },
    {
      connect_id: 10,
      rating: 4,
      alignment_value: 3.5,
      note: "Teammate from a systems course project; quickly ramped up on a new stack and owned the infra work."
    },
    {
      connect_id: 11,
      rating: 5,
      alignment_value: 4.5,
      note: "Former manager who has a strong reputation across the org for building high-performing teams."
    },
    {
      connect_id: 12,
      rating: 3,
      alignment_value: 2.5,
      note: "Met through a fellowship program; solid engineer with growing experience in distributed systems."
    },
    {
      connect_id: 13,
      rating: 4,
      alignment_value: 4.0,
      note: "Co-authored a research paper together; very rigorous thinker and great at communicating complex ideas."
    },
    {
      connect_id: 14,
      rating: 5,
      alignment_value: 4.0,
      note: "Go-to person for frontend architecture in our previous team; consistently raised the quality bar."
    },
    {
      connect_id: 15,
      rating: 3,
      alignment_value: 3.5,
      note: "Paired on several debugging sessions; methodical, curious, and good at untangling legacy code."
    },
  ];

  // Dummy company data for company cards
  const dummyCompanies: CompanyWithImageUrl[] = [
    {
      _id: "dummy-unify",
      _type: "company",
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: "v1",
      company: 1,
      publishedAt: new Date().toISOString(),
      alt: "Unify",
      caption: "Building Custom GTM Workflows",
      imageUrl: "https://cdn.sanity.io/images/ti8yxeb5/production/1e499df3da826b4df6145cadb1df74b743c95b54-870x696.png",
    },
    {
      _id: "dummy-warp",
      _type: "company",
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: "v1",
      company: 3,
      publishedAt: new Date().toISOString(),
      alt: "Warp",
      caption: "Your terminal, supercharged. AI assistance, collaborative workflows, and blazing performance in one beautiful interface.",
      imageUrl: "https://cdn.sanity.io/images/ti8yxeb5/production/517af41f8cb96da2eba886f0332be10b32adfb76-1200x630.jpg",
    },
    {
      _id: "dummy-moment",
      _type: "company",
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: "v1",
      company: 2,
      publishedAt: new Date().toISOString(),
      alt: "Moment",
      caption: "Fixed Income Trading and Data for Wealth Platforms",
      imageUrl: "https://cdn.sanity.io/images/ti8yxeb5/production/ddf920fa884698b26e6baffd7abdf068ccaa0275-896x588.png",
    }
  ];

  // Dummy network connections for each company to show warm intro available
  const dummyNetworkCompanies = new Map<number, NetworkCompanies>([
    [1, { // Unify
      connectionCount: 3,
      connections: [
        { id: 1, name: "Sarah Chen" },
        { id: 2, name: "Michael Rodriguez" },
        { id: 3, name: "Emily Watson" }
      ],
      weight: 4.2,
      quality_score: 4.5 // >= 3.0 means warm intro available
    }],
    [2, { // Moment
      connectionCount: 2,
      connections: [
        { id: 4, name: "David Kim" },
        { id: 5, name: "Jessica Liu" }
      ],
      weight: 3.8,
      quality_score: 3.7
    }],
    [3, { // Warp
      connectionCount: 4,
      connections: [
        { id: 6, name: "Alex Thompson" },
        { id: 7, name: "Rachel Green" },
        { id: 8, name: "James Park" },
        { id: 9, name: "Sophia Martinez" }
      ],
      weight: 4.8,
      quality_score: 2.0
    }]
  ]);

  return (
    <LandingClient
      dummyConnections={dummyConnections}
      dummyCompanies={dummyCompanies}
      dummyNetworkCompanies={dummyNetworkCompanies}
      opportunities={opportunities}
    >
      <div className="space-y-6 max-w-5xl mx-auto px-6">
          <h3 className="text-2xl md:text-3xl font-semibold text-right">
            Network-Driven Warm Introductions to Reimagine Hiring
          </h3>
          <p className="text-base md:text-lg text-neutral-200 leading-relaxed py-4">
            The best hires happen through trusted introductions, not job boards. That&apos;s why we&apos;ve partnered with companies that value network-driven hiring. Browse their stories below to deep dive into some of our partner stories.
          </p>
        </div>
        <ArticleNewsfeed limit={6} cols={3}/>
    </LandingClient>
  );
}
