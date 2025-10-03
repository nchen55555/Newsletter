"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ConnectionScaleProps {
  onSubmit: (value: number) => void;
  isSubmitting?: boolean;
  personName?: string;
  initialRating?: number;
}

export function ConnectionScale({ onSubmit, isSubmitting = false, personName, initialRating }: ConnectionScaleProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(initialRating || null);

  const handleSubmit = () => {
    if (selectedValue !== null) {
      onSubmit(selectedValue);
    }
  };

  const scaleLabels = [
    "Stranger",            
    "Met once or twice",   
    "Know them a bit",     
    "Work well together",  
    "Day-one cofounder"    
  ];

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">
          Where does {personName} sit in your professional network?
        </Label>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-neutral-600 text-center max-w-[80px]">{scaleLabels[0]}</span>
            <span className="text-xs text-neutral-600 text-center max-w-[80px]">{scaleLabels[1]}</span>
            <span className="text-xs text-neutral-600 text-center max-w-[80px]">{scaleLabels[2]}</span>
            <span className="text-xs text-neutral-600 text-center max-w-[80px]">{scaleLabels[3]}</span>
            <span className="text-xs text-neutral-600 text-center max-w-[80px]">{scaleLabels[4]}</span>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="1"
              max="5"
              value={selectedValue || 1}
              onChange={(e) => setSelectedValue(parseInt(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: selectedValue 
                  ? `linear-gradient(to right, #374151 0%, #374151 ${((selectedValue - 1) / 4) * 100}%, #e5e7eb ${((selectedValue - 1) / 4) * 100}%, #e5e7eb 100%)`
                  : '#e5e7eb'
              }}
            />
            <div className="flex justify-between mt-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <div
                  key={value}
                  className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${
                    selectedValue === value
                      ? 'bg-neutral-900'
                      : 'bg-neutral-300 hover:bg-neutral-400'
                  }`}
                  onClick={() => setSelectedValue(value)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedValue === null}
          className="bg-neutral-900 hover:bg-neutral-800 text-white"
        >
          {isSubmitting ? "Connecting..." : "Connect"}
        </Button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #374151;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #374151;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}