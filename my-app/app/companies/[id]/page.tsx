"use server"

import { client } from "@/lib/sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { Container } from "@/app/components/container";
import { CompanyData } from "@/app/types";
import CompanyPageClient from "../../components/company-page-client";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { ReferralInviteDialog } from "@/app/components/referral-invite-dialog";
import { Navigation } from "@/app/components/header";

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

// Query for company data from mediaLibrary
const COMPANY_QUERY = `*[_type == "mediaLibrary" && company == $companyId][0]`;

// Query for company post/article
const COMPANY_POST_QUERY = `*[_type == "post" && company == $companyId][0]`;

type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null;
};

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const companyId = parseInt(resolvedParams.id);

  if (isNaN(companyId)) {
    return (
      <SidebarLayout title="Opportunities">
        <Container>
          <div className="pt-20 pb-16 text-center">
            <h1 className="text-2xl  font-semibold text-neutral-900 mb-4">Invalid Company ID</h1>
            <p className="text-neutral-600">The company ID provided is not valid.</p>
          </div>
        </Container>
      </SidebarLayout>
    );
  }

  try {
    // Fetch company data from Sanity
    const [companyData, postData] = await Promise.all([
      client.fetch(COMPANY_QUERY, { companyId }),
      client.fetch(COMPANY_POST_QUERY, { companyId })
    ]);

    if (!companyData) {
      return (
        <>
        <Navigation/>
          <Container>
            <div className="pt-20 pb-16 text-center">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Company Not Found</h1>
              <p className="text-neutral-600">The requested company could not be found.</p>
            </div>
          </Container>
          </>
      );
    }

    const companyWithImage: CompanyWithImageUrl = {
      ...companyData,
      imageUrl: companyData.image ? urlFor(companyData.image)?.url() || null : null
    };

    return (
      <>
        <CompanyPageClient
          company={companyWithImage}
          companyPost={postData}
        />
        <ReferralInviteDialog companyName={companyWithImage.title} />
        </>
    );

  } catch (error) {
    console.error('Error fetching company data:', error);
    return (
      <>
      <Navigation/>
        <Container>
          <div className="pt-20 pb-16 text-center">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Error Loading Company</h1>
            <p className="text-neutral-600">Failed to load company information. Please try again later.</p>
          </div>
        </Container>
      </>
    );
  }
}