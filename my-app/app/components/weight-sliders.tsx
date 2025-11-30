import { Slider } from "@/components/ui/slider";
import { SimilarityWeights } from "@/app/types/match-types";

export type WeightDimension = keyof SimilarityWeights & string;

interface WeightSlidersProps {
  title: string;
  weights: SimilarityWeights;
  onWeightChange: (weights: Partial<SimilarityWeights>) => void;
  availableDimensions: WeightDimension[];
  showCurrentValues?: boolean;
  resetButtonText?: string;
  onReset?: () => void;
  onApply?: () => void;
  applyButtonText?: string;
  isApplying?: boolean;
}

const DIMENSION_LABELS: Record<string, string> = {
  systems_infrastructure: 'Systems & Infrastructure',
  theory_statistics_ml: 'Theory, Statistics & ML',
  product: 'Product Development',
  repository_similarity: 'Repository / Portfolio Similarity',
};

export function WeightSliders({
  title,
  weights,
  onWeightChange,
  availableDimensions,
  showCurrentValues = true,
  resetButtonText = 'Reset Weights',
  onReset,
  onApply,
  applyButtonText = 'Apply Weights',
  isApplying = false,
}: WeightSlidersProps) {
  const handleWeightChange = (dimension: WeightDimension, value: number) => {
    onWeightChange({
      [dimension]: value
    } as Partial<SimilarityWeights>);
  };

  const getGridCols = () => {
    const count = availableDimensions.length;
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 3) return 'grid-cols-1 md:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-4';
  };

  return (
    <div className="bg-neutral-50 rounded-lg p-4 space-y-4">
      <h4 className="text-sm font-medium text-neutral-700">{title}</h4>
      
      <div className={`grid gap-4 ${getGridCols()}`}>
        {availableDimensions.map((dimension) => (
          <div key={dimension} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-600">
                {DIMENSION_LABELS[dimension] || dimension}
              </label>
              {showCurrentValues && (
                <span className="text-xs text-neutral-500">
                  {weights[dimension] === 1.0 ? 'Equal' : `${weights[dimension]?.toFixed(2) || 1.0}x`}
                </span>
              )}
            </div>
            
            <div className="relative px-1">
              <Slider
                value={[weights[dimension] ?? 1.0]}
                onValueChange={(value) => handleWeightChange(dimension, value[0])}
                min={0}
                max={2}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-neutral-400 mt-1">
                <span>Ignored</span>
                <span>2x</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {(onReset || onApply) && (
        <div className="flex flex-wrap gap-2 justify-center">
          {onReset && (
            <button
              onClick={onReset}
              className="px-4 py-2 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors font-medium"
            >
              {resetButtonText}
            </button>
          )}
          {onApply && (
            <button
              onClick={() => {
                void onApply();
              }}
              disabled={isApplying}
              className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors font-medium"
            >
              {isApplying ? 'Recalculating…' : applyButtonText ?? 'Apply Weights'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}