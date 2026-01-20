"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon, Terminal, Copy, Link } from "lucide-react";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyWithImageUrl } from "@/app/types";
import { Users } from "lucide-react";

interface ReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerElement?: React.ReactNode;
  title?: string;
  description?: string;
  forceFormMode?: boolean;
  allowClose?: boolean;
}

export function ReferralDialog({
  open,
  onOpenChange,
  triggerElement,
  title = "Refer Someone to The Niche",
  description = "Access to the Niche is strictly referral-based.",
  forceFormMode = false,
  allowClose = false
}: ReferralDialogProps) {
  const [referralType, setReferralType] = useState<"form" | "link">("form");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithImageUrl | null>(null);
  const [allCompanies, setAllCompanies] = useState<CompanyWithImageUrl[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [referralName, setReferralName] = useState("");
  const [referralEmail, setReferralEmail] = useState("");
  const [referralPhone, setReferralPhone] = useState("");
  const [referralBackground, setReferralBackground] = useState("");
  const [referralFormError, setReferralFormError] = useState<string | null>(null);
  const [referralFormSuccess, setReferralFormSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [referrerName, setReferrerName] = useState<string>("");
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch user profile for referral functionality
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
        } else {
          console.error("No ID found in profile data:", data);
        }
        const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        setReferrerName(`${capitalizeFirstLetter(data.first_name || '')} ${capitalizeFirstLetter(data.last_name || '')}`);
      })
      .catch(error => {
        console.error("Failed to fetch user profile:", error);
      })
      .finally(() => {
        setProfileLoading(false);
      });
  }, []);

  // Fetch all companies when dialog opens
  useEffect(() => {
    if (open && referralType === "link") {
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
  }, [open, referralType]);

  // Generate referral link
  const generateReferralLink = () => {
    if (!currentUserId || !selectedCompanyId) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/companies/${selectedCompanyId}?referral_id=${currentUserId}`;
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    const link = generateReferralLink();
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  const handleReferralFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReferralFormError(null);
    setReferralFormSuccess(false);

    if ((!referralEmail && !referralPhone) || !referralBackground) {
      setReferralFormError("Please provide at least an email or phone number and the background.");
      return;
    }

    if (profileLoading) {
      setReferralFormError("Profile is still loading. Please wait a moment and try again.");
      return;
    }

    if (!currentUserId) {
      console.error("Form submitted without currentUserId - profileLoading:", profileLoading);
      setReferralFormError("Unable to load your profile. Please refresh the page and try again.");
      return;
    }

    // Extra safeguard: double-check that we have a valid user ID
    if (typeof currentUserId !== 'number' || currentUserId <= 0) {
      console.error("Invalid currentUserId:", currentUserId, "type:", typeof currentUserId);
      setReferralFormError("Invalid user profile data. Please refresh the page and try again.");
      return;
    }

    try {
      console.log("Submitting referral with valid currentUserId:", currentUserId);
      const res = await fetch('/api/post_referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: referrerName,
          referralName: referralName,
          referralEmail: referralEmail,
          referralPhone: referralPhone,
          referralBackground: referralBackground,
          id: currentUserId
        }),
      });

      if (res.ok) {
        setReferralFormSuccess(true);
        setReferralName("");
        setReferralEmail("");
        setReferralPhone("");
        setReferralBackground("");
      } else {
        setReferralFormError("Failed to submit referral. Please try again.");
      }
    } catch (error) {
      setReferralFormError(`An error occurred. Please try again. ${error}`);
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    // Only allow closing if allowClose is true, or a referral was successfully submitted
    if (!newOpen && !allowClose && !referralFormSuccess) {
      return;
    }

    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset form state when closing
      setReferralFormError(null);
      setReferralFormSuccess(false);
      if (referralFormSuccess) {
        // Only clear form if it was successfully submitted
        setReferralName("");
        setReferralEmail("");
          setReferralPhone("");
        setReferralBackground("");
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
      <DialogContent className="sm:max-w-[600px] p-8" showCloseButton={allowClose}>
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-neutral-200 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Referral Type Selection */}
          {!forceFormMode && (
            <div className="flex gap-4 p-4 rounded-lg">
            <button
              onClick={() => setReferralType("form")}
              className={`flex-1 p-3 rounded-md border-2 transition-colors ${
                referralType === "form"
                  ? "border-neutral-100 hover:border-neutral-300"
                  : "border-neutral-900 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" />
                <span className="font-medium">Submit Form</span>
              </div>
              <p className="text-sm text-neutral-400">Fill out a quick form with your friends&apos; details and we will reach out to them!</p>
            </button>
            <button
              onClick={() => setReferralType("link")}
              className={`flex-1 p-3 rounded-md border-2 transition-colors ${
                referralType === "link"
                  ? "border-neutral-100 hover:border-neutral-300"
                  : "border-neutral-900 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Link className="w-4 h-4" />
                <span className="font-medium">Share Link</span>
              </div>
              <p className="text-sm text-neutral-400">If there is a specific opportunity that you think would be a great fit for a friend, share this link to them for them to request access.</p>
            </button>
          </div>
          )}

          {/* Link Generation */}
          {!forceFormMode && referralType === "link" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium text-neutral-200">Search Company</Label>
                <Input
                  value={companySearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCompanySearch(value);
                    // Reset selection when search changes
                    setSelectedCompanyId(undefined);
                    setSelectedCompany(null);
                  }}
                  placeholder={loadingCompanies ? "Loading companies..." : "Start typing a company name..."}
                  className="h-12"
                />
                {!loadingCompanies && companySearch.trim().length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 shadow-sm">
                    {allCompanies
                      .filter((company) => {
                        const name = company.alt || company.caption || `Company ${company.company}`;
                        return name.toLowerCase().includes(companySearch.toLowerCase());
                      })
                      .slice(0, 8)
                      .map((company) => {
                        const name = company.alt || company.caption || `Company ${company.company}`;
                        const isSelected = selectedCompanyId === company.company;
                        return (
                          <button
                            key={company._id}
                            type="button"
                            onClick={() => {
                              setSelectedCompany(company);
                              setSelectedCompanyId(company.company);
                              setCompanySearch(name);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm ${
                              isSelected ? "font-medium" : ""
                            }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {selectedCompany && selectedCompanyId && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg">
                    <Label className="text-sm font-medium text-neutral-200">Your Referral Link</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={generateReferralLink()}
                        readOnly
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        onClick={handleCopyLink}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        {copySuccess ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </div>
                  {copySuccess && (
                    <Alert>
                      <CheckCircle2Icon className="h-4 w-4" />
                      <AlertTitle>Link copied to clipboard!</AlertTitle>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form Submission */}
          {(forceFormMode || referralType === "form") && (
            <form onSubmit={handleReferralFormSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="referralName" className="text-base font-medium">Name *</Label>
                  <Input 
                    id="referralName" 
                    name="referralName"
                    type="text"
                    value={referralName} 
                    onChange={(e) => setReferralName(e.target.value)}
                    placeholder="Jane Doe"
                    className="h-12 text-lg px-4" 
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-base font-medium">Contact Info *</Label>
                  <p className="text-xs text-neutral-400">
                    Provide at least one way for us to contact your referral (email or phone, or both).
                  </p>
                  <div className="flex flex-col md:flex-row items-stretch gap-4">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="referralEmail" className="text-sm font-medium">Email</Label>
                      <Input 
                        id="referralEmail" 
                        name="referralEmail"
                        type="email"
                        value={referralEmail} 
                        onChange={(e) => setReferralEmail(e.target.value)}
                        placeholder="person@email.com"
                        className="h-12 text-lg px-4" 
                      />
                    </div>
                    <div className="hidden md:block w-px bg-neutral-800/60" />
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="referralPhone" className="text-sm font-medium">Phone (disabled for now)</Label>
                      <Input 
                        id="referralPhone" 
                        name="referralPhone"
                        type="tel"
                        value={referralPhone} 
                        onChange={(e) => setReferralPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="h-12 text-lg px-4" 
                        disabled={true}
                      />
                    </div>
                  </div>
                  
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="referralBackground" className="text-base font-medium">How Do You Know Them?</Label>
                  <Input
                    id="referralBackground"
                    name="referralBackground"
                    value={referralBackground}
                    onChange={(e) => setReferralBackground(e.target.value)}
                    placeholder="Group project partner, former colleague at ..."
                    className="h-12 text-lg px-4"
                    required
                  />
                </div>
                {referralFormSuccess && (
                  <div className="mt-4">
                    <Alert className="max-w-full break-words overflow-hidden">
                      <CheckCircle2Icon className="flex-shrink-0 mt-0.5" />
                      <AlertTitle className="break-words whitespace-normal leading-relaxed w-full overflow-wrap-anywhere">
                        Referral submitted successfully! We&apos;ll reach out to them. 
                      </AlertTitle>
                    </Alert>
                  </div>
                )}
                {referralFormError && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{referralFormError}</AlertTitle>
                  </Alert>
                )}
              </div>
              <DialogFooter className="mt-8 gap-4">
                <Button 
                  type="submit" 
                  className="h-12 px-8 text-lg"
                  disabled={profileLoading || !currentUserId}
                >
                  {profileLoading ? "Loading..." : "Submit Referral"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}