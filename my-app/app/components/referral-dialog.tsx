"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon, Terminal } from "lucide-react";

interface ReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerElement?: React.ReactNode;
  title?: string;
  description?: string;
}

export function ReferralDialog({ 
  open, 
  onOpenChange, 
  triggerElement,
  title = "Refer Someone You Want to Bring To Your Verified Professional Network",
  description = "We are personal referral only and will verify if your referral is a good fit for our partner companies!"
}: ReferralDialogProps) {
  const [referralName, setReferralName] = useState("");
  const [referralEmail, setReferralEmail] = useState("");
  const [referralBackground, setReferralBackground] = useState("");
  const [referralFormError, setReferralFormError] = useState<string | null>(null);
  const [referralFormSuccess, setReferralFormSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [referrerName, setReferrerName] = useState<string>("");
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch user profile for referral functionality
  useEffect(() => {
    setProfileLoading(true);
    fetch("/api/get_profile", { credentials: "include" })
      .then(res => {
        console.log("Profile response status:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("Profile data received:", data);
        if (data.id) {
          setCurrentUserId(data.id);
          console.log("Current user ID set to:", data.id);
        } else {
          console.error("No ID found in profile data:", data);
        }
        const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        setReferrerName(`${capitalizeFirstLetter(data.first_name || '')} ${capitalizeFirstLetter(data.last_name || '')}`);
      })
      .catch(error => {
        console.error("Failed to fetch user profile:", error);
      })
      .finally(() => {
        setProfileLoading(false);
      });
  }, []);

  const handleReferralFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReferralFormError(null);
    setReferralFormSuccess(false);

    console.log("Form submission started - profileLoading:", profileLoading, "currentUserId:", currentUserId);

    if (!referralEmail || !referralBackground) {
      setReferralFormError("Please fill in all required fields.");
      return;
    }

    if (profileLoading) {
      setReferralFormError("Profile is still loading. Please wait a moment and try again.");
      return;
    }

    if (!currentUserId) {
      console.error("Form submitted without currentUserId - profileLoading:", profileLoading);
      setReferralFormError("Unable to load your profile. Please refresh the page and try again.");
      return;
    }

    // Extra safeguard: double-check that we have a valid user ID
    if (typeof currentUserId !== 'number' || currentUserId <= 0) {
      console.error("Invalid currentUserId:", currentUserId, "type:", typeof currentUserId);
      setReferralFormError("Invalid user profile data. Please refresh the page and try again.");
      return;
    }

    try {
      console.log("Submitting referral with valid currentUserId:", currentUserId);
      const res = await fetch('/api/post_referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: referrerName,
          referralName: referralName,
          referralEmail: referralEmail,
          referralBackground: referralBackground,
          id: currentUserId
        }),
      });

      if (res.ok) {
        setReferralFormSuccess(true);
        setReferralName("");
        setReferralEmail("");
        setReferralBackground("");
      } else {
        setReferralFormError("Failed to submit referral. Please try again.");
      }
    } catch (error) {
      setReferralFormError(`An error occurred. Please try again. ${error}`);
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset form state when closing
      setReferralFormError(null);
      setReferralFormSuccess(false);
      if (referralFormSuccess) {
        // Only clear form if it was successfully submitted
        setReferralName("");
        setReferralEmail("");
        setReferralBackground("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {triggerElement && (
        <DialogTrigger asChild>
          {triggerElement}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] p-8" showCloseButton={false}>
        <DialogHeader className="mb-8">
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-neutral-600 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleReferralFormSubmit}>
          <div className="grid gap-8">
            <div className="grid gap-2">
              <Label htmlFor="referralName" className="text-base font-medium">Name *</Label>
              <Input 
                id="referralName" 
                name="referralName"
                type="text"
                value={referralName} 
                onChange={(e) => setReferralName(e.target.value)}
                placeholder="Jane Doe"
                className="h-12 text-lg px-4" 
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="referralEmail" className="text-base font-medium">Email *</Label>
              <Input 
                id="referralEmail" 
                name="referralEmail"
                type="email"
                value={referralEmail} 
                onChange={(e) => setReferralEmail(e.target.value)}
                placeholder="person@email.com"
                className="h-12 text-lg px-4" 
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="referralBackground" className="text-base font-medium">How Do You Know Them?</Label>
              <Input
                id="referralBackground"
                name="referralBackground"
                value={referralBackground}
                onChange={(e) => setReferralBackground(e.target.value)}
                placeholder="Group project partner, former colleague at ..."
                className="h-12 text-lg px-4"
                required
              />
            </div>
            {referralFormSuccess && (
              <Alert>
                <CheckCircle2Icon />
                <AlertTitle className="break-words whitespace-normal">
                  Referral submitted successfully! We&apos;ll review and reach out to them if they&apos;re a good fit.
                </AlertTitle>
              </Alert>
            )}
            {referralFormError && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>{referralFormError}</AlertTitle>
              </Alert>
            )}
          </div>
          <DialogFooter className="mt-8 gap-4">
            <Button 
              type="submit" 
              className="h-12 px-8 text-lg"
              disabled={profileLoading || !currentUserId}
            >
              {profileLoading ? "Loading..." : "Submit Referral"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}