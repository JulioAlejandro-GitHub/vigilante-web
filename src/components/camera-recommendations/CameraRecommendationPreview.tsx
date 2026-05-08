import { AlertCircle, CheckCircle2 } from "lucide-react";

import { CameraRecommendationValueBlock } from "./CameraRecommendationValueBlock";
import { StatusBadge } from "../StatusBadge";
import type { CameraRecommendationPreviewResponse } from "../../types/api";
import { shortId } from "../../utils/format";

interface CameraRecommendationPreviewProps {
  preview: CameraRecommendationPreviewResponse | null;
}

export function CameraRecommendationPreview({ preview }: CameraRecommendationPreviewProps) {
  if (!preview) {
    return (
      <section className="rounded border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">
        Patch preview is not available yet.
      </section>
    );
  }

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">Patch preview</h3>
          <p className="mt-1 text-sm text-zinc-600">
            Camera {shortId(preview.recommendation.camera_id)} - {preview.impact || "No impact text returned by API."}
          </p>
        </div>
        <StatusBadge value={preview.applicable ? "applicable" : "blocked"} tone={preview.applicable ? "success" : "warning"} />
      </div>

      {preview.validation_errors.length > 0 ? (
        <div className="border-b border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <div className="font-medium">Preview validation</div>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {preview.validation_errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-b border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            API preview reports this patch can be applied.
          </div>
        </div>
      )}

      {preview.patches.length === 0 ? (
        <div className="p-4 text-sm text-zinc-600">No metadata patch was returned.</div>
      ) : (
        <div className="divide-y divide-zinc-200">
          {preview.patches.map((patch) => (
            <article key={patch.metadata_path} className="p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="label">Metadata path</div>
                  <div className="mt-1 break-all font-mono text-sm text-zinc-950">{patch.metadata_path}</div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <StatusBadge value={patch.stale ? "stale" : "current"} tone={patch.stale ? "danger" : "success"} />
                  <StatusBadge value={patch.current_value_present ? "current found" : "current missing"} tone={patch.current_value_present ? "info" : "warning"} />
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div>
                  <div className="label">Current value</div>
                  <div className="mt-1 text-sm text-zinc-900">
                    <CameraRecommendationValueBlock value={patch.current_value_present ? patch.current_value : null} compact />
                  </div>
                </div>
                <div>
                  <div className="label">Expected current</div>
                  <div className="mt-1 text-sm text-zinc-900">
                    <CameraRecommendationValueBlock
                      value={patch.expected_current_value_present ? patch.expected_current_value : "not constrained"}
                      compact
                    />
                  </div>
                </div>
                <div>
                  <div className="label">Proposed value</div>
                  <div className="mt-1 text-sm text-zinc-900">
                    <CameraRecommendationValueBlock value={patch.suggested_value} compact />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
