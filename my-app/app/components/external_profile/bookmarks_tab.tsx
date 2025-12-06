import { CompanyWithImageUrl } from "@/app/types";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyCard } from "../company-card";
import { Button } from "@/components/ui/button";
import ApplyCompanies from "../apply-companies";
import { Send } from "lucide-react";

export function BookmarksTab({
  isExternalView,
  firstName,
  bookmarkedCompanies,
  loadingBookmarks,
}: {
  isExternalView?: boolean;
  firstName?: string | null;
  bookmarkedCompanies: CompanyWithImageUrl[];
  loadingBookmarks: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-900">Bookmarked and Recommended</h3>
        {!isExternalView && (
            <ApplyCompanies
                triggerElement={
                    <Button
                    size="sm"
                    className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Request an Intro to an Opportunity
                </Button>
              }
            />
          )}
      </div>
      {loadingBookmarks ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : bookmarkedCompanies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {bookmarkedCompanies.map(company => (
            <CompanyCard key={company._id} company={company} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500">
          {isExternalView
            ? `${firstName} hasn't bookmarked any companies yet.`
            : "You haven't bookmarked any companies yet."}
        </div>
      )}
    </div>
  );
}
