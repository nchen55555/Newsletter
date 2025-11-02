'use client'
import React from "react";
import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyWithImageUrl } from "@/app/types";
import { useSubscriptionContext } from "./subscription_context";
import ApplyButton from "./apply";

export default function ApplyCompanies({ 
  triggerElement
}: { 
  triggerElement?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [allCompanies, setAllCompanies] = useState<CompanyWithImageUrl[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithImageUrl | null>(null);
  const { isSubscribed } = useSubscriptionContext();

  // Fetch all companies
  useEffect(() => {
    if (open) {
      const fetchAllCompanies = async () => {
        setLoadingCompanies(true);
        try {
          const response = await fetch('/api/companies', {
            credentials: 'include'
          });
          if (response.ok) {
            const companies = await response.json();
            setAllCompanies(companies);
          }
        } catch (error) {
          console.error('Error fetching companies:', error);
        } finally {
          setLoadingCompanies(false);
        }
      };
      fetchAllCompanies();
    }
  }, [open]);

  // Don't render if user is not subscribed
  if (!isSubscribed) return null;

  const handleApply = () => {
    // Close the selection dialog
    setOpen(false);
    // Reset selection for next time
    setTimeout(() => {
      setSelectedCompany(null);
      setSelectedCompanyId(undefined);
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerElement || (
          <Button
            variant="outline"
            size="sm"
            className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Apply to Company
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Apply to a Company
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Choose a company you&apos;d like to apply to from our partner network.
          </p>
        </DialogHeader>
        <div className="space-y-4">
          {/* Company Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Company</label>
            <Select value={selectedCompanyId?.toString() || ""} onValueChange={(value) => {
              const companyId = parseInt(value);
              const company = allCompanies.find(c => c.company === companyId);
              setSelectedCompany(company || null);
              setSelectedCompanyId(companyId);
            }} disabled={loadingCompanies}>
              <SelectTrigger>
                <SelectValue placeholder={loadingCompanies ? "Loading companies..." : "Choose a company to apply to..."} />
              </SelectTrigger>
              <SelectContent>
                {allCompanies.map((company) => (
                  <SelectItem key={company._id} value={company.company.toString()}>
                    {company.alt || company.caption || `Company ${company.company}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Show Apply Button when company is selected */}
          {selectedCompany && selectedCompanyId && (
            <div className="mt-6 p-4 border border-neutral-200 rounded-lg bg-neutral-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-neutral-900">
                    {selectedCompany.alt || selectedCompany.caption || `Company ${selectedCompany.company}`}
                  </h4>
                  <p className="text-sm text-neutral-600">
                    Ready to apply to this company?
                  </p>
                </div>
                <ApplyButton 
                  company={selectedCompanyId.toString()} 
                  onIntroRequested={handleApply}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => setOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}