import * as React from "react"
import { SidebarLayout } from "@/app/components/sidebar-layout"
import { Container } from "@/app/components/container"
import { ProtectedContent } from "../components/protected-content"


export default async function PortfolioPage() {
    return (
      <ProtectedContent>
        <SidebarLayout title="Partner Companies">
          <Container>
            <div className="max-w-6xl mx-auto py-8 md:py-16 px-4 md:px-6">
              {/* Header Section */}
              <div className="mb-10">
                <h1 className="text-2xl md:text-4xl font-bold mb-4 text-neutral-800">
                  our partner companies
                </h1>
                <p className="text-base md:text-lg text-neutral-600 mb-6 md:mb-10">
                  we&apos;ve exclusively partnered with these companies to surface exciting opportunities for you to get involved in! each partner works exclusively with us to flesh out a company profile. for our cohort members who want to get connected to our partner startups, we provide an expedited application and introduction that is surfaced above all of their inbound. you will get a direct introduction to the founders for your first meeting.
                </p>  
                <p className="text-base md:text-lg text-neutral-600 mb-6 md:mb-10">
                 you can bookmark a company if you are interested in learning more and potentially reading the company profile. <strong>if you are ready to get connected and want to apply to join the company, click to get connected and if there is mutual interest with the startup, we will make the introduction to the founder. </strong>
                </p>
              </div>

              {/* Portfolio Cards */}
              {/* <CompanyCards companies={companies} /> */}
            </div>
          </Container>
        </SidebarLayout>
      </ProtectedContent>
    );
}
