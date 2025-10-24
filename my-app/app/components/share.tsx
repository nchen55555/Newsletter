'use client'
import React from "react";
import { useState, useEffect } from "react";
import { Send, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { encodeSimple } from "../utils/simple-hash";

export default function Share({ 
  company, 
  isDemo = false, 
  onShare 
}: { 
  company: number; 
  isDemo?: boolean; 
  onShare?: () => void; 
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile to get their ID
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch("/api/get_profile", { credentials: "include" });
        if (res.ok) {
          const profile = await res.json();
          setUserId(profile.id);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  // Generate the shareable link with encoded user ID
  const shareableLink = userId 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/companies/${company}?ref=${encodeSimple(userId)}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/companies/${company}`;

  const handleCopyLink = async () => {
    if (isDemo) {
      // Demo mode - simulate copying
      setCopied(true);
      onShare?.(); // Trigger tour callback
      setTimeout(() => {
        setCopied(false);
        setOpen(false); // Close dialog after demo
      }, 1500);
      return;
    }

    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error("Failed to copy link:", error);
      // Fallback: select the text for manual copying
      const input = document.getElementById('share-link-input') as HTMLInputElement;
      if (input) {
        input.select();
        input.setSelectionRange(0, 99999); // For mobile devices
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Share company"
          className="transition-all duration-300"
        >
          <Send className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Share This Company Profile
            {isDemo && <span className="ml-2 text-sm text-gray-600">(Demo Mode)</span>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                id="share-link-input"
                value={loading ? "Generating your unique link..." : shareableLink}
                readOnly
                className="flex-1"
                disabled={loading}
              />
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
                disabled={loading}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-sm text-neutral-600">
            {isDemo 
              ? "✨ in demo mode, clicking copy will complete the tour step without actually copying the link!" 
              : loading
              ? "Generating your personalized referral link..."
              : userId
              ? "Share this personalized link to let others view the company profile. When they visit through your link, you'll get credit for the referral!"
              : "Share this link to let others view the company profile and refer them to the opportunity!"
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}