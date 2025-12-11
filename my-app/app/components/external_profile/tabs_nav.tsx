import { AvailableTab } from "@/app/types/match-types";
import { getClientConfig } from "@/app/components/client-config";

export function ProfileTabsNav({
  activeTab,
  setActiveTab,
  clientConfig,
  counts,
  isExternalView,
  firstName,
}: {
  activeTab: AvailableTab;
  setActiveTab: (tab: AvailableTab) => void;
  clientConfig: ReturnType<typeof getClientConfig>;
  counts: {
    bookmarks: number;
    // threads: number;
    referrals: number;
    projects: number;
    network: number;
  };
  isExternalView?: boolean;
  firstName?: string | null;
}) {
  return (
    <div className="border-b border-neutral-200 mb-6">
      <nav className="flex space-x-8">
        {clientConfig.showBookmarks && (
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'bookmarks'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            {isExternalView ? `Companies ${firstName} Bookmarked` : 'Bookmarked Companies'} (
            {counts.bookmarks})
          </button>
        )}
        {/* {clientConfig.showThreads && (
          <button
            onClick={() => setActiveTab('threads')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'threads'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            {isExternalView ? `${firstName}'s Threads` : 'Your Threads'}
          </button>
        )} */}
        {clientConfig.showReferrals && (
          <button
            onClick={() => setActiveTab('referrals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'referrals'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            {isExternalView ? `${firstName}'s Referrals` : 'Your Referrals'} ({counts.referrals})
          </button>
        )}
        {clientConfig.showProjects && (
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'projects'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>
                {isExternalView ? `${firstName}'s Projects` : 'Your Projects'} ({counts.projects})
              </span>
            </div>
          </button>
        )}
        {clientConfig.showConnections && (
          <button
            onClick={() => setActiveTab('connections')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'connections'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            {isExternalView ? `${firstName}'s Network` : 'Your Network'} 
          </button>
        )}
        {clientConfig.showNetworkSimilarity && (
          <button
            onClick={() => setActiveTab('network')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'network'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            {isExternalView ? `${firstName}'s Network Similarity` : 'Network Similarity'} ({counts.network})
          </button>
        )}
        {clientConfig.showSkillScores && (
          <button
            onClick={() => setActiveTab('scores')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'scores'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Github Portfolio Analysis
          </button>
        )}
        <button
          onClick={() => setActiveTab('timeline')}
          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'timeline'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
          }`}
        >
          Timeline
        </button>
      </nav>
    </div>
  );
}
