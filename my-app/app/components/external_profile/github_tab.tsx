import { SimilarDeveloper } from "../external_profile";
import { GitHubProfileAnalysis } from "@/app/types/github-analysis";
import { Github } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SimilarDeveloperCard from "./similar_developer_card";
import { RepositoryCard, type RepositoryEmbedding } from "./repository_card";

interface GitHubSimilarityAnalysisResult {
  composite_success_score: number;
  pca_pattern_match?: {
    overall_score: number;
    variance_explained?: number[];
  };
  signature_dimension_match?: {
    weighted_match: number;
  };
  range_compatibility?: {
    dimensions_in_range: number;
    total_dimensions_checked: number;
  };
  shared_cluster_match?: {
    shared_cluster: boolean;
  };
}

export function ScoresTab({
  repositoryEmbeddings,
  githubAnalysis,
  githubSimilarityAnalysis,
  clientId,
  similarDevelopers,
  loadingSimilarDevelopers,
  similarDevelopersError,
  fetchSimilarDevelopers,
}: {
  repositoryEmbeddings: RepositoryEmbedding[];
  githubAnalysis: GitHubProfileAnalysis | null;
  githubSimilarityAnalysis: GitHubSimilarityAnalysisResult | null;
  clientId?: number | null;
  similarDevelopers: SimilarDeveloper[];
  loadingSimilarDevelopers: boolean;
  similarDevelopersError: string;
  fetchSimilarDevelopers: () => Promise<void>;
}) {

  return (
    <div className="space-y-6">
    
      <Accordion type="multiple" className="mt-8 space-y-2">
        {/* 1) GitHub Portfolio Similarity (Ideal Employees) */}
        <AccordionItem value="github-portfolio-similarity">
          <AccordionTrigger className="text-base md:text-lg">
            Compatability to Company Conditioning on Previously Interviewed Candidates
          </AccordionTrigger>
          <AccordionContent>
            {githubSimilarityAnalysis ? (
              <div className="space-y-4 text-sm text-neutral-800">
                {/* Overall score - full width */}
                <div className="border border-neutral-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-neutral-800 mb-1">
                    Overall portfolio match
                  </div>
                  <div className="text-2xl font-semibold text-neutral-900">
                    {(githubSimilarityAnalysis.composite_success_score * 100).toFixed(1)}%
                  </div>
                  <div className="text-neutral-600 mt-1">
                    This is a combined score (0–100%) summarizing how closely this candidate&apos;s
                    portfolio matches the success patterns learned from the company&apos;s ideal
                    employees.
                  </div>
                </div>

                {/* Detailed metrics in a 2x2 grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PCA pattern match */}
                  {githubSimilarityAnalysis.pca_pattern_match && (
                    <div className="border border-neutral-200 rounded-lg p-4">
                      <div className="text-sm font-semibold text-neutral-800 mb-1">
                        PCA pattern match
                      </div>
                      <div className="text-xl font-semibold text-neutral-900">
                        {(
                          githubSimilarityAnalysis.pca_pattern_match.overall_score * 100
                        ).toFixed(1)}
                        %
                      </div>
                      <div className="text-neutral-600 mt-2">
                        Measures how similar the overall distribution of this candidate&apos;s
                        portfolio is to the successful candidates that have interviewed along the
                        main latent dimensions (principal components) of the embedding space.
                      </div>
                      {githubSimilarityAnalysis.pca_pattern_match.variance_explained && (
                        <div className="mt-2 text-xs text-neutral-600">
                          <span className="font-medium">Variance explained by top patterns:</span>{" "}
                          {githubSimilarityAnalysis.pca_pattern_match.variance_explained
                            .map((v: number) => `${(v * 100).toFixed(1)}%`)
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Signature dimension match */}
                  {githubSimilarityAnalysis.signature_dimension_match && (
                    <div className="border border-neutral-200 rounded-lg p-4">
                      <div className="text-sm font-semibold text-neutral-800 mb-1">
                        Signature dimension match
                      </div>
                      <div className="text-xl font-semibold text-neutral-900">
                        {(
                          githubSimilarityAnalysis.signature_dimension_match.weighted_match * 100
                        ).toFixed(1)}
                        %
                      </div>
                      <div className="text-neutral-600 mt-2">
                        Focuses on the specific dimensions where the successful candidates that have
                        interviewed are most similar to each other, and checks how close this
                        candidate&apos;s portfolio is on those &quot;signature&quot; dimensions.
                      </div>
                    </div>
                  )}

                  {/* Range compatibility */}
                  {githubSimilarityAnalysis.range_compatibility && (
                    <div className="border border-neutral-200 rounded-lg p-4">
                      <div className="text-sm font-semibold text-neutral-800 mb-1">
                        Range compatibility
                      </div>
                      <div className="text-xl font-semibold text-neutral-900">
                        {githubSimilarityAnalysis.range_compatibility.dimensions_in_range}/
                        {githubSimilarityAnalysis.range_compatibility.total_dimensions_checked}{" "}
                        dimensions in range
                      </div>
                      <div className="text-neutral-600 mt-2">
                        Counts how many key dimensions of this portfolio fall within the observed
                        range of the ideal employees&apos; portfolios.
                      </div>
                    </div>
                  )}

                  {/* Cluster overlap */}
                  {githubSimilarityAnalysis.shared_cluster_match && (
                    <div className="border border-neutral-200 rounded-lg p-4">
                      <div className="text-sm font-semibold text-neutral-800 mb-1">
                        Cluster overlap
                      </div>
                      <div className="text-sm font-medium text-neutral-900">
                        {githubSimilarityAnalysis.shared_cluster_match.shared_cluster
                          ? "Shares a cluster with ideal employees"
                          : "Does not fall into the same cluster as the ideal group"}
                      </div>
                      <div className="text-neutral-600 mt-2">
                        Checks whether this portfolio lands in the same dense region of the
                        embedding space as the ideal employees (using clustering over all
                        repositories).
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-neutral-500">
                GitHub portfolio similarity analysis is not available for this profile yet.
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 2) Repository Technology Analysis */}
        <AccordionItem value="repository-technology-analysis">
          <AccordionTrigger className="text-base md:text-lg">
            Repository Technology Analysis
          </AccordionTrigger>
          <AccordionContent>
            {repositoryEmbeddings.length > 0 ? (
              <div className="space-y-4">
                {repositoryEmbeddings.map((repo, index) => (
                  <RepositoryCard
                    key={index}
                    repo={repo}
                    githubAnalysis={githubAnalysis}
                    similarDevelopers={similarDevelopers}
                    clientId={clientId}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-neutral-500">
                No repository embedding analysis is available for this profile yet.
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 3) Technical Project Analysis */}
        <AccordionItem value="technical-project-analysis">
          <AccordionTrigger className="text-base md:text-lg">
            Developer Similarity
          </AccordionTrigger>
          <AccordionContent>
            <div>
              {similarDevelopers.length > 0 && (
                <div className="space-y-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-md font-semibold text-neutral-900">
                        Similar Developers
                      </h4>
                      <p className="text-sm text-neutral-500 mt-1">
                        Based on repository code analysis across all of your projects
                      </p>
                    </div>
                    <button
                      onClick={fetchSimilarDevelopers}
                      disabled={loadingSimilarDevelopers}
                      className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    >
                      {loadingSimilarDevelopers ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {similarDevelopers
                      .slice()
                      .sort((a, b) => b.totalSimilarity - a.totalSimilarity)
                      .map((developer, index) => (
                        <SimilarDeveloperCard
                          key={index}
                          developer={developer}
                          clientId={clientId}
                        />
                      ))}
                  </div>
                </div>
              )}

              {loadingSimilarDevelopers && (
                <div className="text-center py-8">
                  <div className="text-neutral-500">Loading similar developers...</div>
                </div>
              )}

              {similarDevelopersError && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-6">
                  {similarDevelopersError}
                </div>
              )}

              {!githubAnalysis && (
                <div className="text-center py-8 text-neutral-500">
                  <div className="mb-4">
                    <Github className="h-12 w-12 mx-auto text-neutral-300 mb-2" />
                    No GitHub analysis data found
                  </div>
                  <p className="text-sm">
                    We don&apos;t have detailed GitHub project analysis for this profile yet.
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
