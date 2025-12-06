"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const connectionLabels = [
  "Stranger",            
  "Met once or twice",   
  "Know them well",     
  "Work well together",  
  "Day-one cofounder"    
];

interface ConnectionScaleProps {
  onSubmit: (value: number, note?: string) => void;
  isSubmitting?: boolean;
  personName?: string;
  initialRating?: number;
  mode?: 'connection' | 'audience';
  showConnectButton?: boolean;
}

export function ConnectionScale({ onSubmit, isSubmitting = false, personName, initialRating, mode = 'connection', showConnectButton = true }: ConnectionScaleProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(initialRating || null);
  const [connectionNote, setConnectionNote] = useState<string>('');

  const handleSubmit = () => {
    if (selectedValue === null) return;
    // When not in audience mode and showing a connect button, require a short note
    if (mode !== 'audience' && showConnectButton && connectionNote.trim().length < 50) {
      return;
    }
    onSubmit(selectedValue, connectionNote.trim());
  };

  const connectionLabels = [
    "Stranger",            
    "Met once or twice",   
    "Know them well",     
    "Work well together",  
    "Day-one cofounder"    
  ];

  const audienceLabels = [
    "Public to all",
    "Recognize professionally", 
    "Professional network",
    "Close colleagues",
    "Your Most Trusted Contacts"
  ];

  const scaleLabels = mode === 'audience' ? audienceLabels : connectionLabels;

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">
          {mode === 'audience' 
            ? "Who can view your thread in your network?"
            : `Where does ${personName} sit in your professional network?`
          }
        </Label>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {scaleLabels.map((label, index) => {
            const value = index + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSelectedValue(value);
                  if (!showConnectButton) onSubmit(value);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedValue === value
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {mode !== 'audience' && showConnectButton && (

        <div className="space-y-2">
           <div className="rounded-lg border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800 space-y-3 mb-4">
            <p className="font-medium">
              Only connect with people you&apos;d actually want to:
            </p>

            <ul className="text-xs text-blue-900 list-disc list-inside space-y-2">
              <li>Use as a benchmark for opportunities recommended to you</li>
              <li>See what opportunities they have been interested in</li>
            </ul>
            <p className="text-xs text-blue-900">
              Your connections will not see your note or rating, but we&apos;ll
              use it to power better recommendations for both of you.
            </p>
          </div>

          <Label className="text-sm font-medium text-neutral-800">
            How do you know {personName || "this person"}?{" "}
            <span className="text-neutral-500">(min 50 characters)</span>
          </Label>
          <textarea
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 resize-none"
            rows={3}
            value={connectionNote}
            onChange={(e) => setConnectionNote(e.target.value)}
            placeholder="E.g., We interned together for 6 months, and I supervised their work closely."
          />
          {connectionNote.trim().length > 0 && connectionNote.trim().length < 50 && (
            <p className="text-xs text-red-600">
              Please add a bit more detail (at least 50 characters).
            </p>
          )}
        </div>
      )}

      {mode === 'connection' && showConnectButton && (
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              selectedValue === null ||
              (showConnectButton && connectionNote.trim().length < 50)
            }
            className="bg-neutral-900 hover:bg-neutral-800 text-white"
          >
            {isSubmitting ? "Connecting..." : "Connect"}
          </Button>
        </div>
      )}

    </div>
  );
}