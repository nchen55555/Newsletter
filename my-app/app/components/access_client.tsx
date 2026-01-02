"use client";

import { useEffect, useState } from "react";
import LandingClient from "./landing_client";
import { Subscribe } from "./subscribe";
import { useSubscriptionContext } from "./subscription_context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Navigation } from "./header";


export default function AccessClient() {
  const { isSubscribed, loading } = useSubscriptionContext();
  const [showNoAccountDialog, setShowNoAccountDialog] = useState(false);

  useEffect(() => {
    if (!loading && !isSubscribed) {
      setShowNoAccountDialog(true);
    }
  }, [loading, isSubscribed]);

  // While subscription status is loading, just show the landing (avoids flash)
  if (loading) {
    return <LandingClient />;
  }

  if (isSubscribed) {
    return (<>  
        <Navigation />
        <LandingClient />
        </>
        );
  }
  

  // Not subscribed: show dialog explaining there is no account yet, plus Subscribe UI
  return (
    <>
      <Dialog open={showNoAccountDialog} onOpenChange={setShowNoAccountDialog}>
        <DialogContent className="sm:max-w-lg w-full max-w-md p-8 flex flex-col items-center justify-center text-center">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-xl font-semibold">
              You Need a Niche Profile to Access This Content
            </DialogTitle>
            <DialogDescription className="text-center mt-2 text-neutral-200">
              You don&apos;t have an active Niche profile yet.
              Request access below to create your profile and join The Niche network.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full mt-4 flex justify-center">
            <Subscribe />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


