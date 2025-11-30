import { Skeleton } from "@/components/ui/skeleton";
import { FeedThread } from "../feed-thread";
import { FeedItem } from "@/app/types";

export function ThreadsTab({
  isExternalView,
  firstName,
  userThreads,
  loadingThreads,
}: {
  isExternalView?: boolean;
  firstName?: string | null;
  userThreads: FeedItem[];
  loadingThreads: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-900">Your Threads</h3>
      </div>
      {loadingThreads ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : userThreads.length > 0 ? (
        <div className="space-y-6">
          {userThreads.map(thread => (
            <FeedThread key={thread.id} feedItem={thread} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500">
          {isExternalView
            ? `${firstName} hasn't posted any threads yet.`
            : "You haven't posted any threads yet."}
        </div>
      )}
    </div>
  );
}
