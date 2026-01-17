"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConnectionScale } from "./connection-scale";
import { getConnectionButtonContent, type ConnectionStatusType } from "./connection-status-helpers";
import {useSubscriptionContext} from "./subscription_context";

export type ConnectVerificationStatus = "idle" | "success" | "error" | "invalid" | "pending";
export type ConnectionStatus = ConnectionStatusType;

interface ConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName: string;
  profileImageUrl?: string;
  isSubmitting: boolean;
  verificationStatus: ConnectVerificationStatus;
  statusMessage: string;
  existingRating?: number;
  existingAlignmentValue?: number;
  initialNote?: string;
  onSubmit: (scaleValue: number, alignmentValue?: number, note?: string) => void;
  trigger?: ReactNode;
  connectionStatus?: ConnectionStatus;
  compact?: boolean;
}

export function ConnectDialog({
  open,
  onOpenChange,
  firstName,
  profileImageUrl,
  isSubmitting,
  verificationStatus,
  statusMessage,
  existingRating,
  existingAlignmentValue,
  initialNote, 
  onSubmit,
  trigger,
  connectionStatus = "none",
  compact = false,
}: ConnectDialogProps) {
  const getDialogTitle = () => {
    switch (connectionStatus) {
      case "connected":
        return "Update Your Connection";
      case "requested":
        return "Connection Request Pending";
      case "pending":
        return "Accept Connection Request";
      case "none":
      default:
        return "Contextualize Your Connection with " + firstName;
    }
  };
  const { isSubscribed } = useSubscriptionContext();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button
              size="sm"
              className="inline-flex items-center gap-2 w-full max-w-full"
              variant={connectionStatus === "connected" ? "outline" : "default"}
              disabled={!isSubscribed}
            >
              {getConnectionButtonContent(connectionStatus, compact)}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl w-full px-12 py-10">
        <DialogHeader>
          <DialogTitle className="text-2xl leading-relaxed tracking-tight">
            {getDialogTitle()}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <ConnectionScale
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            personName={firstName}
            initialRating={existingRating || undefined}
            initialNote={initialNote}
            profileImageUrl={profileImageUrl}
            initialAlignmentValue={existingAlignmentValue || undefined}
          />

          {/* Status Message Display */}
          {verificationStatus !== "idle" && (
            <div
              className={`mt-6 p-4 rounded-lg text-sm`}
            >
              {statusMessage}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


