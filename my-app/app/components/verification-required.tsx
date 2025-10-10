"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

interface VerificationRequiredProps {
  title?: string;
  description?: string;
  actionText?: string;
  className?: string;
  redirectUrl?: string;
}

export function VerificationRequired({ 
  title = "Request to join The Niche network for access to this content",
  redirectUrl = "/profile"
}: VerificationRequiredProps) {
  const router = useRouter();

  const handleRequestAccess = () => {
    router.push(redirectUrl);
  };

  return (
      <Alert className="cursor-pointer hover:bg-gray-50" onClick={handleRequestAccess}>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">{title}</span>
          </AlertDescription>
        </Alert>
  );
}

export function VerificationRequiredSection({ 
  children, 
  title,
  description,
  className = "",
  redirectUrl = "/profile"
}: { 
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  redirectUrl?: string;
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
      <VerificationRequired 
        title={title}
        description={description}
        redirectUrl={redirectUrl}
      />
    </div>
  );
}