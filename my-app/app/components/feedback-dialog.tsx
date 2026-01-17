"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon, Terminal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerElement?: React.ReactNode;
  title?: string;
  description?: string;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  triggerElement,
  title = "Share Your Feedback",
  description = "We'd love to hear your thoughts, suggestions, or any issues you're experiencing.",
}: FeedbackDialogProps) {
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature" | "general">("general");
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackFormError, setFeedbackFormError] = useState<string | null>(null);
  const [feedbackFormSuccess, setFeedbackFormSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch user profile for feedback functionality
  useEffect(() => {
    setProfileLoading(true);
    fetch("/api/get_profile", { credentials: "include" })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.id) {
          setCurrentUserId(data.id);
        }
        const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        setUserName(`${capitalizeFirstLetter(data.first_name || '')} ${capitalizeFirstLetter(data.last_name || '')}`);
        setFeedbackEmail(data.email || '');
      })
      .catch(error => {
        console.error("Failed to fetch user profile:", error);
      })
      .finally(() => {
        setProfileLoading(false);
      });
  }, []);

  const handleFeedbackFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackFormError(null);
    setFeedbackFormSuccess(false);

    if (!feedbackMessage || !feedbackSubject) {
      setFeedbackFormError("Please fill in all required fields.");
      return;
    }

    if (profileLoading) {
      setFeedbackFormError("Profile is still loading. Please wait a moment and try again.");
      return;
    }

    if (!currentUserId) {
      setFeedbackFormError("Unable to load your profile. Please refresh the page and try again.");
      return;
    }

    try {
      const res = await fetch('/api/post_feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: currentUserId,
          userName: userName,
          userEmail: feedbackEmail,
          feedbackType: feedbackType,
          subject: feedbackSubject,
          message: feedbackMessage,
        }),
      });

      if (res.ok) {
        setFeedbackFormSuccess(true);
        setFeedbackSubject("");
        setFeedbackMessage("");
        setFeedbackType("general");
      } else {
        setFeedbackFormError("Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      setFeedbackFormError(`An error occurred. Please try again. ${error}`);
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setFeedbackFormError(null);
      setFeedbackFormSuccess(false);
      if (feedbackFormSuccess) {
        setFeedbackSubject("");
        setFeedbackMessage("");
        setFeedbackType("general");
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
      <DialogContent className="sm:max-w-[600px] p-8">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-neutral-200 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Feedback Type Selection */}
          <div className="flex gap-2 p-2 rounded-lg">
            <button
              onClick={() => setFeedbackType("general")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                feedbackType === "general"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setFeedbackType("feature")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                feedbackType === "feature"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-200"
              }`}
            >
              Feature Request
            </button>
            <button
              onClick={() => setFeedbackType("bug")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                feedbackType === "bug"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-200"
              }`}
            >
              Bug Report
            </button>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleFeedbackFormSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="feedbackSubject" className="text-base font-medium">Subject *</Label>
                <Input
                  id="feedbackSubject"
                  name="feedbackSubject"
                  type="text"
                  value={feedbackSubject}
                  onChange={(e) => setFeedbackSubject(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  className="h-12 text-lg px-4"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feedbackMessage" className="text-base font-medium">Message *</Label>
                <Textarea
                  id="feedbackMessage"
                  name="feedbackMessage"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Please share your detailed feedback..."
                  className="min-h-[150px] text-lg px-4 py-3 resize-y"
                  required
                />
              </div>
              {feedbackFormSuccess && (
                <div className="mt-4">
                  <Alert className="max-w-full break-words overflow-hidden">
                    <CheckCircle2Icon className="flex-shrink-0 mt-0.5" />
                    <AlertTitle className="break-words whitespace-normal leading-relaxed w-full overflow-wrap-anywhere">
                      Thank you for your feedback! We&apos;ll review it carefully and reach out if we have additional questions!
                    </AlertTitle>
                  </Alert>
                </div>
              )}
              {feedbackFormError && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>{feedbackFormError}</AlertTitle>
                </Alert>
              )}
            </div>
            <DialogFooter className="mt-8 gap-4">
              <Button
                type="submit"
                className="h-12 px-8 text-lg"
                disabled={profileLoading || !currentUserId}
              >
                {profileLoading ? "Loading..." : "Submit Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
