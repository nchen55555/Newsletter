"use client"

import { GitHubProfileAnalysis } from "@/app/types/github-analysis";
import { SimilarDeveloper } from "../external_profile";
import { SimilarRepoMatchCard } from "./similar_repo_match_card";

export interface RepositoryEmbedding {
  repository_name: string;
  file_count: number;
  contribution_type: string;
  technologies?: Record<string, string[]>;
  assessment?: Record<string, string | string[]>;
  summary?: string;
  updated_at?: string;
  // Embedding can be stored as JSON string or numeric array
  embedding?: number[] | string | null;
}

interface RepositoryCardProps {
  repo: RepositoryEmbedding;
  githubAnalysis: GitHubProfileAnalysis | null;
  similarDevelopers: SimilarDeveloper[];
  clientId?: number | null;
}

export function RepositoryCard({
  repo,
  githubAnalysis,
  similarDevelopers,
  clientId,
}: RepositoryCardProps) {
  const repoUrl =
    githubAnalysis?.analyzedRepositories?.find(
      (r) => r.name === repo.repository_name,
    )?.url ||
    githubAnalysis?.repositoryGroups?.find(
      (g) => g.repositoryName === repo.repository_name,
    )?.url ||
    (githubAnalysis?.username
      ? `https://github.com/${githubAnalysis.username}`
      : null);

  const handleClick = () => {
    if (!repoUrl) return;
    try {
      window.open(repoUrl, "_blank");
    } catch {
      // no-op
    }
  };

  const matches: {
    developer: SimilarDeveloper;
    similarity: number;
    matchedRepo: string;
  }[] = [];

  similarDevelopers.forEach((developer) => {
    developer.repositoryMatches.forEach((match) => {
      if (match.queryRepo === repo.repository_name) {
        matches.push({
          developer,
          similarity: match.similarity,
          matchedRepo: match.matchedRepo,
        });
      }
    });
  });

  const topMatches =
    matches.length > 0
      ? matches.sort((a, b) => b.similarity - a.similarity).slice(0, 3)
      : [];

  return (
    <div
      className="rounded-lg p-4 border border-neutral-200 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg md:text-xl font-semibold text-neutral-900">
          {repo.repository_name}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 bg-neutral-200 px-2 py-1 rounded">
            {repo.file_count} files
          </span>
          <span className="text-xs text-neutral-500 bg-neutral-200 px-2 py-1 rounded">
            {repo.contribution_type}
          </span>
        </div>
      </div>

      {repo.summary && (
        <p className="text-sm text-neutral-700 mb-3">{repo.summary}</p>
      )}

      {repo.technologies && (
        <div className="mb-3">
          <h5 className="text-xs font-medium text-neutral-600 mb-2">
            Technologies
          </h5>
          <div className="space-y-2">
            {Object.entries(repo.technologies as Record<string, string[]>).map(
              ([category, items]) =>
                items.length > 0 && (
                  <div key={category}>
                    <span className="text-xs font-medium text-neutral-700 mr-2 capitalize">
                      {category.replace(/([A-Z])/g, " $1").trim()}:
                    </span>
                    <div className="mt-1 inline-flex flex-wrap gap-1">
                      {items.slice(0, 8).map((item: string, i: number) => (
                        <span
                          key={i}
                          className="text-[11px] text-neutral-600 px-1 py-0.5 rounded-sm transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text"
                        >
                          {item}
                        </span>
                      ))}
                      {items.length > 8 && (
                        <span className="text-xs text-neutral-500 px-2 py-1">
                          +{items.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                ),
            )}
          </div>
        </div>
      )}

      {repo.assessment && (
        <div className="pt-3 border-t border-neutral-300">
          <div className="flex flex-col gap-3 text-xs">
            {Object.entries(
              repo.assessment as Record<string, string | string[]>,
            ).map(([key, value]) =>
              value ? (
                <div key={key}>
                  <div className="font-medium text-neutral-700 capitalize mb-0.5">
                    {key.replace(/_/g, " ")}
                  </div>
                  <div className="text-neutral-700">
                    {Array.isArray(value)
                      ? value.join(", ")
                      : value.replace(/_/g, " ")}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}

      {topMatches.length > 0 && (
        <div className="mt-4 pt-3 border-t border-neutral-200 space-y-2">
          <h5 className="text-xs font-medium text-neutral-700">
            Candidates with Similar Repositories
          </h5>
          <div className="flex flex-col gap-2 md:flex-row">
            {topMatches.map(({ developer, matchedRepo }, i) => (
              <SimilarRepoMatchCard
                key={i}
                developer={developer}
                matchedRepo={matchedRepo}
                clientId={clientId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


