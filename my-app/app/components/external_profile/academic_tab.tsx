"use client";
import { ProfileData } from "@/app/types";
import { 
  ExternalProfileProps,
  CandidateMatch,
  SimilarityWeights,
  CompanyCompatibilityResponse,
} from "@/app/types/match-types";
import { useRouter } from "next/navigation";
import { encodeSimple } from "@/app/utils/simple-hash";
import SimilarCandidateCard from "../similar_candidate_card";
import { Skeleton } from "@/components/ui/skeleton";
import { WeightSliders, type WeightDimension } from "../weight-sliders";

export function SimilarCandidatesTab({
  isCompanyView,
  props,
  similarCandidatesFromPipeline,
  similarityWeights,
  setSimilarityWeights,
  availableSimilarityDimensions,
  loadingCompatibility,
  companyCompatibility,
  companySimilarityWeights,
  setCompanySimilarityWeights,
  isRecalculating,
  onRecalculate,
  isCompanyRecalculating,
  onCompanyRecalculate,
}: {
  isCompanyView: boolean;
  props: ExternalProfileProps;
  similarCandidatesFromPipeline: CandidateMatch[];
  similarityWeights: SimilarityWeights;
  setSimilarityWeights: React.Dispatch<React.SetStateAction<SimilarityWeights>>;
  availableSimilarityDimensions: WeightDimension[];
  loadingCompatibility: boolean;
  companyCompatibility: {
    company: unknown;
    compatibility: CompanyCompatibilityResponse;
  } | null;
  companySimilarityWeights: SimilarityWeights;
  setCompanySimilarityWeights: React.Dispatch<React.SetStateAction<SimilarityWeights>>;
  isRecalculating?: boolean;
  onRecalculate?: () => void;
  isCompanyRecalculating?: boolean;
  onCompanyRecalculate?: () => void;
}) {
  const router = useRouter();

  if (!isCompanyView) return null;

  const availableDimensions: WeightDimension[] = availableSimilarityDimensions;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-900">Similarity in Profiles</h3>
      </div>

      <WeightSliders
        title="Adjust Weighted Focus (Skills & Portfolio)"
        weights={similarityWeights}
        onWeightChange={newWeights =>
          setSimilarityWeights(prev => ({ ...prev, ...newWeights }))
        }
        availableDimensions={availableDimensions}
        onApply={onRecalculate}
        applyButtonText="Recalculate Similarity"
        isApplying={isRecalculating}
        onReset={() => {
          const reset: Record<string, number> = {};
          availableDimensions.forEach(dim => {
            reset[dim] = 1.0;
          });
          setSimilarityWeights(prev => ({ ...prev, ...reset }));
        }}
      />

      {/* Company compatibility breakdown */}
      {loadingCompatibility ? (
        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="text-sm text-neutral-500">Loading compatibility...</div>
        </div>
      ) : companyCompatibility ? (
        <div className="space-y-4">
          {/* Match Breakdown */}
          <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-neutral-700">Match Breakdown</h4>
              <span className="text-sm font-semibold text-green-700">
                {companyCompatibility.compatibility.similarity_percentage.toFixed(1)}% overall match
              </span>
            </div>
            <div className="space-y-3">
              {[
                {
                  key: 'systems_infrastructure' as const,
                  name: 'Systems & Infrastructure',
                },
                {
                  key: 'theory_statistics_ml' as const,
                  name: 'Theory & Statistics',
                },
                {
                  key: 'product' as const,
                  name: 'Core Product Engineering',
                },
              ]
                .filter(({ key }) => {
                  const skills = companyCompatibility.compatibility.skills;
                  return skills[key] > 0;
                })
                .map(({ key, name }) => {
                  const compat = companyCompatibility.compatibility;
                  const candidate = compat.skills[key] || 0;
                  const companyReq = compat.company_requirements[key] || 0;
                  const diff = compat.skill_differences[key] || 0;
                  const weight = companySimilarityWeights[key] || 0;

                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-neutral-700">
                            {name}
                          </span>
                          <span className="text-xs text-neutral-500">
                            Weight: {weight.toFixed(2)}x
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-neutral-600">
                          <span>You: {candidate.toFixed(1)}</span>
                          <span>Company Avg: {companyReq.toFixed(1)}</span>
                          <span
                            className={`font-medium ${
                              diff >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {diff >= 0 ? '+' : ''}
                            {diff.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Company Compatibility Weight Controls */}
          <WeightSliders
            title="Adjust Company Match Focus"
            weights={companySimilarityWeights}
            onWeightChange={newWeights =>
              setCompanySimilarityWeights(prev => ({ ...prev, ...newWeights }))
            }
            onApply={onCompanyRecalculate}
            applyButtonText="Recalculate Company Match"
            isApplying={isCompanyRecalculating}
            availableDimensions={[
              ...(companyCompatibility.compatibility.skills
                .systems_infrastructure > 0
                ? ['systems_infrastructure']
                : []),
              ...(companyCompatibility.compatibility.skills
                .theory_statistics_ml > 0
                ? ['theory_statistics_ml']
                : []),
              ...(companyCompatibility.compatibility.skills.product > 0
                ? ['product']
                : []),
            ]}
            showCurrentValues={true}
            resetButtonText="Reset to Calculated"
            onReset={() => {
              const clusterWeights =
                companyCompatibility.compatibility.cluster_stats
                  ?.cluster_weights;
              if (clusterWeights) {
                setCompanySimilarityWeights({
                  systems_infrastructure:
                    clusterWeights.systems_infrastructure ?? 1.0,
                  theory_statistics_ml:
                    clusterWeights.theory_statistics_ml ?? 1.0,
                  product: clusterWeights.product ?? 1.0,
                  github_similarity:
                    companySimilarityWeights.github_similarity ?? 1.0,
                });
              } else {
                setCompanySimilarityWeights({
                  systems_infrastructure: 1.0,
                  theory_statistics_ml: 1.0,
                  product: 1.0,
                  github_similarity:
                    companySimilarityWeights.github_similarity ?? 1.0,
                });
              }
            }}
          />
        </div>
      ) : (
        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="text-sm text-neutral-500">
            Skill assessment required for compatibility analysis
          </div>
        </div>
      )}

      {similarCandidatesFromPipeline.length === 0 && props.client_id ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : similarCandidatesFromPipeline.length > 0 ? (
        <div className="space-y-4">
          {similarCandidatesFromPipeline
            .filter(match => match.profile?.id !== props.id && match.profile)
            .slice(0, 5)
            .map(match => (
              <SimilarCandidateCard
                key={match.candidate_id}
                profile={match.profile as ProfileData}
                onClick={() => {
                  if (match.profile?.id && props.client_id) {
                    const encodedId = encodeSimple(match.profile.id);
                    const clientEncodedId = encodeSimple(props.client_id);
                    router.push(`/external_profile/${encodedId}_${clientEncodedId}`);
                  } else if (match.profile?.id) {
                    const encodedId = encodeSimple(match.profile.id);
                    router.push(`/external_profile/${encodedId}`);
                  }
                }}
                similarityPercentage={match.similarity_percentage}
              />
            ))}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500">
          No similar candidates found.
        </div>
      )}
    </div>
  );
}
