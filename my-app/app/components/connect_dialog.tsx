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

export type ConnectVerificationStatus = "idle" | "success" | "error" | "invalid" | "pending";
export type ConnectionStatus = ConnectionStatusType;

interface ConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName: string;
  isSubmitting: boolean;
  verificationStatus: ConnectVerificationStatus;
  statusMessage: string;
  existingRating?: number;
  initialNote?: string;
  onSubmit: (scaleValue: number, note?: string) => void;
  trigger?: ReactNode;
  connectionStatus?: ConnectionStatus;
  compact?: boolean;
}

export function ConnectDialog({
  open,
  onOpenChange,
  firstName,
  isSubmitting,
  verificationStatus,
  statusMessage,
  existingRating,
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
        return "Index Your Opportunities on People Who You Want to Define Your Career Trajectory";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button
              size="sm"
              className="inline-flex items-center gap-2 w-full max-w-full"
              variant={connectionStatus === "connected" ? "outline" : "default"}
            >
              {getConnectionButtonContent(connectionStatus, compact)}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl w-full px-12 py-10">
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


