import { ExternalLink } from "lucide-react";

import {
  CameraRecommendationFlagBadge,
  CameraRecommendationSeverityBadge,
  CameraRecommendationStatusBadge,
} from "./CameraRecommendationStatusBadge";
import { formatRecommendationValue } from "./CameraRecommendationValueBlock";
import type { CameraRecommendation } from "../../types/api";
import { summarizeValue } from "../../utils/evidence";
import { formatDateTime, shortId } from "../../utils/format";

interface CameraRecommendationListProps {
  recommendations: CameraRecommendation[];
  selectedId?: string | null;
  onSelect: (recommendationId: string) => void;
  onCameraFilter: (cameraId: string) => void;
}

function confidenceLabel(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }
  return `${Math.round(value * 100)}%`;
}

function reasonSummary(recommendation: CameraRecommendation) {
  return recommendation.reason || summarizeValue(recommendation.evidence) || "-";
}

export function CameraRecommendationList({
  recommendations,
  selectedId,
  onSelect,
  onCameraFilter,
}: CameraRecommendationListProps) {
  return (
    <>
      <div className="hidden overflow-hidden md:block md:rounded md:border md:border-zinc-200 md:bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-100 text-left text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Recommendation</th>
                <th className="px-4 py-3">Camera</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Suggested</th>
                <th className="px-4 py-3">Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {recommendations.map((recommendation) => (
                <tr
                  key={recommendation.recommendation_id}
                  className={`cursor-pointer align-top hover:bg-zinc-50 ${
                    selectedId === recommendation.recommendation_id ? "bg-teal-50/60" : ""
                  }`}
                  onClick={() => onSelect(recommendation.recommendation_id)}
                >
                  <td className="max-w-sm px-4 py-3">
                    <div className="font-medium text-zinc-950">{recommendation.title || recommendation.recommendation_type}</div>
                    <div className="mt-1 text-xs text-zinc-500">{shortId(recommendation.recommendation_id)}</div>
                    <div className="mt-2 line-clamp-2 text-xs text-zinc-600">{reasonSummary(recommendation)}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <CameraRecommendationFlagBadge
                        label="actionable"
                        active={recommendation.actionable}
                        activeText="true"
                        inactiveText="false"
                      />
                      <CameraRecommendationFlagBadge
                        label="auto_apply"
                        active={recommendation.auto_apply}
                        activeText="true"
                        inactiveText="false"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="inline-flex items-center gap-1 text-left font-medium text-teal-800 underline-offset-2 hover:underline"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onCameraFilter(recommendation.camera_id);
                      }}
                    >
                      {shortId(recommendation.camera_id)}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <CameraRecommendationStatusBadge status={recommendation.status} />
                  </td>
                  <td className="px-4 py-3">{recommendation.recommendation_type}</td>
                  <td className="px-4 py-3">
                    <CameraRecommendationSeverityBadge severity={recommendation.severity} />
                    <div className="mt-2 text-xs text-zinc-500">Confidence {confidenceLabel(recommendation.confidence)}</div>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <div className="line-clamp-3 break-words text-xs text-zinc-700">
                      {formatRecommendationValue(recommendation.suggested_value)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDateTime(recommendation.generated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {recommendations.map((recommendation) => (
          <article
            key={recommendation.recommendation_id}
            className={`panel w-full p-4 text-left hover:border-teal-200 hover:bg-teal-50/30 ${
              selectedId === recommendation.recommendation_id ? "border-teal-300 bg-teal-50/60" : ""
            }`}
            onClick={() => onSelect(recommendation.recommendation_id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-zinc-950">{recommendation.title || recommendation.recommendation_type}</div>
                <div className="mt-1 text-xs text-zinc-500">{shortId(recommendation.recommendation_id)}</div>
              </div>
              <CameraRecommendationStatusBadge status={recommendation.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-zinc-900">
              <div>
                <div className="label">Camera</div>
                <button
                  className="mt-1 break-words text-left font-medium text-teal-800 underline-offset-2 hover:underline"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCameraFilter(recommendation.camera_id);
                  }}
                >
                  {shortId(recommendation.camera_id)}
                </button>
              </div>
              <div>
                <div className="label">Type</div>
                <div className="mt-1 break-words">{recommendation.recommendation_type}</div>
              </div>
              <div>
                <div className="label">Severity</div>
                <div className="mt-1">
                  <CameraRecommendationSeverityBadge severity={recommendation.severity} />
                </div>
              </div>
              <div>
                <div className="label">Generated</div>
                <div className="mt-1">{formatDateTime(recommendation.generated_at)}</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-zinc-700">{reasonSummary(recommendation)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CameraRecommendationFlagBadge label="actionable" active={recommendation.actionable} activeText="true" inactiveText="false" />
              <CameraRecommendationFlagBadge label="auto_apply" active={recommendation.auto_apply} activeText="true" inactiveText="false" />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
