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
  onSubmit: (value: number) => void;
  isSubmitting?: boolean;
  personName?: string;
  initialRating?: number;
  mode?: 'connection' | 'audience';
  showConnectButton?: boolean;
}

export function ConnectionScale({ onSubmit, isSubmitting = false, personName, initialRating, mode = 'connection', showConnectButton = true }: ConnectionScaleProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(initialRating || null);

  const handleSubmit = () => {
    if (selectedValue !== null) {
      onSubmit(selectedValue);
    }
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

      {mode === 'connection' && showConnectButton && (
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedValue === null}
            className="bg-neutral-900 hover:bg-neutral-800 text-white"
          >
            {isSubmitting ? "Connecting..." : "Connect"}
          </Button>
        </div>
      )}

    </div>
  );
}