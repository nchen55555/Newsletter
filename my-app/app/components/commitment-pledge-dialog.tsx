'use client'

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface CommitmentPledgeDialogProps {
  open: boolean;
  onAccept: () => void;
}

export function CommitmentPledgeDialog({ open, onAccept }: CommitmentPledgeDialogProps) {
  const [hasAgreed, setHasAgreed] = useState(false);

  const handleAgreementToggle = () => {
    setHasAgreed(!hasAgreed);
  };


  const handleAcceptPledge = async () => {
    if (!hasAgreed) return;
    
    const formData = new FormData();
    formData.append('professional_agreement', hasAgreed.toString());
    // First, update the profile
    const res = await fetch('/api/post_profile', { 
      method: 'PATCH',
      body: formData 
    })
    if (res.ok) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}} modal={true}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center mb-4">
            The Niche Commitment Pledge
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Main pledge text */}
          <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed">
            <p>
              By joining The Niche Network, you pledge to uphold a professional standard that respects the time of both our team and partner companies. This includes a commitment to providing timely responses (within 5 business days) to all messages and interview requests, and a strict no-ghosting policy. If your interest in an opportunity changes, you agree to communicate this proactively so we can efficiently reallocate resources.
            </p>
            <br></br>
            <p>
              Furthermore, you are responsible for setting clear and accurate expectations within your profile—including your skills, salary requirements, and current commitment level—as this foundational honesty is critical for creating the high-quality matches our community is built on. This information is not sent to our partner companies but rather makes it so that our platform can match most efficiently.
            </p>
          </div>

          {/* Agreement checkbox */}
          <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg border">
            <button
              onClick={handleAgreementToggle}
              className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                hasAgreed 
                  ? 'bg-neutral-900 border-neutral-900 text-white' 
                  : 'border-neutral-300 hover:border-neutral-400'
              }`}
            >
              {hasAgreed && <Check className="w-4 h-4" />}
            </button>
            <label 
              onClick={handleAgreementToggle}
              className="text-sm text-neutral-700 cursor-pointer leading-relaxed"
            >
              I understand and agree to uphold The Niche Commitment Pledge, including timely communication, accurate profile information, and professional conduct standards outlined above.
            </label>
          </div>
        </div>
        
        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleAcceptPledge} 
            disabled={!hasAgreed}
            className={`px-8 transition-all duration-200 ${
              hasAgreed 
                ? 'bg-neutral-900 hover:bg-neutral-800 text-white' 
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            }`}
          >
            Agree and Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}