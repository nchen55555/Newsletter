"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ProfileAvatar from "./profile_avatar";

export const connectionLabels = [
  "Stranger",            
  "Met once or twice",   
  "Know them well",     
  "Work well together",  
  "Day-one cofounder"    
];

interface ConnectionScaleProps {
  onSubmit: (value: number, alignmentValue?: number, note?: string) => void;
  isSubmitting?: boolean;
  personName?: string;
  initialRating?: number;
  initialAlignmentValue?: number;
  mode?: 'connection' | 'audience';
  showConnectButton?: boolean;
  initialNote?: string;
  profileImageUrl?: string;
}

export function ConnectionScale({
  onSubmit,
  isSubmitting = false,
  personName,
  initialRating,
  initialAlignmentValue,
  mode = 'connection',
  showConnectButton = true,
  initialNote,
  profileImageUrl,
}: ConnectionScaleProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(initialRating || null);
  const [selectedAlignmentValue, setSelectedAlignmentValue] = useState<number | null>(initialAlignmentValue || null);
  const [connectionNote, setConnectionNote] = useState<string>(initialNote || '');

  const handleSubmit = () => {
    if (selectedValue === null) return;

    if (selectedAlignmentValue === null) return;
    // When not in audience mode and showing a connect button, require a short note
    if (mode !== 'audience' && showConnectButton && connectionNote.trim().length < 50) {
      return;
    }
    onSubmit(selectedValue, selectedAlignmentValue, connectionNote.trim());
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
        {mode === 'audience' ? (
          <Label className="text-base font-medium">
            Who can view your thread in your network?
          </Label>
        ) : (
          <div className="flex items-center gap-8">
            {profileImageUrl && (
              <ProfileAvatar
                name={personName || "Connection"}
                imageUrl={profileImageUrl}
                size={128}                 // was 40 → try 56, 64, or 72
                editable={false}
                className="w-48 h-48 rounded-full flex-shrink-0"  // keep these in sync: w-16/h-16 ≈ 64px
              />
            )}
            <div>
              <Label className="text-base font-medium text-center">
                {`Where does ${personName} sit in your professional network?`}
              </Label>
              <i className="text-xs leading-snug">
                    Your notes and ratings are only visible to you.
                  </i>
                <div className="space-y-8 mt-4">
                  <div className="flex flex-wrap justify-center gap-1">
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
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                          selectedValue === value
                            ? 'bg-neutral-100 text-black'
                            : 'bg-neutral-900 text-neutral-200 hover:bg-neutral-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  How much should we index the opportunities recommended to you on {personName || "this person"}&apos;s interests and activity?
                </Label>
                <i className="text-xs leading-snug mb-4">
                    Your notes and ratings are only visible to you.
                  </i>
                <div className="flex flex-wrap justify-center gap-1 mt-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={`alignment-${value}`}
                      type="button"
                      onClick={() => {
                        setSelectedAlignmentValue(value);
                        if (!showConnectButton) onSubmit(value);
                      }}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                        selectedAlignmentValue === value
                          ? 'bg-neutral-100 text-black'
                          : 'bg-neutral-900 text-neutral-200 hover:bg-neutral-200'
                      }`}
                    >
                      {value === 1
                        ? 'Low (1)'
                        : value === 5
                        ? 'High (5)'
                        : value}
                    </button>
                  ))}
                </div>
              </div>
              {mode === 'connection' && selectedValue !== 1 && showConnectButton && (
                <div className="space-y-2">
                  <Label className="text-base font-medium flex items-end gap-2">
                    <span>Describe your professional relationship. Why do you want to index on {personName || "this person"}?</span>
                  </Label>
                  <i className="text-xs leading-snug">
                    Your notes and ratings are only visible to you.
                  </i>
                  <textarea
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-400 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 resize-none"
                    rows={3}
                    value={connectionNote}
                    onChange={(e) => setConnectionNote(e.target.value)}
                    placeholder="E.g., We interned together for 6 months, and I supervised their work closely."
                  />
                  {connectionNote.trim().length > 0 && connectionNote.trim().length < 50 && (
                    <p className="text-xs text-white">
                      Please add a bit more detail (at least 50 characters).
                    </p>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </div>

      {mode === 'connection' && showConnectButton && (
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              selectedValue === null ||
              (selectedValue != 1 && showConnectButton && connectionNote.trim().length < 50) ||
              selectedAlignmentValue === null
            }
            className="bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
          >
            {isSubmitting ? "submitting..." : "submit"}
          </Button>
        </div>
      )}

    </div>
  );
}