"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "./app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { LandingPageSearch } from "./landing-page-search"
import { Separator } from "@/components/ui/separator"
import { useSubscriptionContext } from "./subscription_context"
import { Button } from "@/components/ui/button"
import { UserPlus, Info } from "lucide-react"
import { ReferralDialog } from "./referral-dialog"
import { FeedbackDialog } from "./feedback-dialog"
import { CompanyData } from "@/app/types"

interface SidebarLayoutProps {
  children: React.ReactNode
  title?: string
  defaultOpen?: boolean
}

export function SidebarLayout({ children, title, defaultOpen}: SidebarLayoutProps) {
  const { isSubscribed } = useSubscriptionContext();
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [opportunities, setOpportunities] = useState<CompanyData[]>([]);

  // Fetch opportunities for search
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const res = await fetch('/api/companies', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setOpportunities(data || []);
      } catch (e) {
        console.error('Failed to fetch opportunities for search:', e);
      }
    };

    fetchOpportunities();
  }, []);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar/>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-sidebar">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {title && (
            <h1 className="text-lg font-semibold flex-shrink-0 hidden md:block">{title}</h1>
          )}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <LandingPageSearch
              isLandingPage={false}
              isSubscribed={isSubscribed}
              variant="compact"
              opportunities={opportunities}
            />
          </div>
          <div className="flex-shrink-0 flex hidden md:block">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReferralDialogOpen(true)}
              className="gap-2"
              disabled={!isSubscribed}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Refer</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFeedbackDialogOpen(true)}
              className="gap-2"
              disabled={!isSubscribed}
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Feedback/Help</span>
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col bg-background">
          {children}
        </div>
      </SidebarInset>
      <ReferralDialog
        open={referralDialogOpen}
        onOpenChange={setReferralDialogOpen}
        allowClose={true}
      />
      <FeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
      />
    </SidebarProvider>
  )
}
