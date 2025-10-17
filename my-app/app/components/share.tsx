'use client'
import React from "react";
import { useState } from "react";
import { Send, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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

  // Generate the shareable link
  const shareableLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/companies/${company}`;

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
                value={shareableLink}
                readOnly
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
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
              : "Share this link to let others view this company profile. Certain details are only accessible if you are part of The Niche network."
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}