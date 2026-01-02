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
        return "Accept Connection Request";
      case "pending":
        return "Connection Request Pending";
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
          />

          {/* Status Message Display */}
          {verificationStatus !== "idle" && (
            <div
              className={`mt-6 p-4 rounded-lg text-sm ${
                verificationStatus === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : verificationStatus === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-yellow-50 text-yellow-700 border border-yellow-200"
              }`}
            >
              {statusMessage}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


