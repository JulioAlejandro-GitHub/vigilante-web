import { RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { api } from "../api/vigilanteApi";
import { CameraRecommendationDetail } from "../components/camera-recommendations/CameraRecommendationDetail";
import { CameraRecommendationList } from "../components/camera-recommendations/CameraRecommendationList";
import { DataState, EmptyState } from "../components/DataState";
import { FilterBar } from "../components/filters/FilterBar";
import { FormField } from "../components/forms/FormField";
import { PageHeader } from "../components/PageHeader";
import { PaginationControls } from "../components/PaginationControls";
import { QueueQuickFilters } from "../components/queues/QueueQuickFilters";
import { StatusBadge } from "../components/StatusBadge";
import { useAsyncData } from "../hooks/useAsyncData";
import { useCameraRecommendations } from "../hooks/useCameraRecommendations";
import { useQueryParams } from "../hooks/useQueryParams";
import type { CameraRecommendation } from "../types/api";
import { summarizeValue } from "../utils/evidence";

type CameraRecommendationQueryParams = {
  status: string;
  camera_id: string;
  recommendation_type: string;
  severity: string;
  q: string;
  recommendation_id: string;
  detail: "open" | "closed";
  limit: number;
  offset: number;
};

const CAMERA_RECOMMENDATION_DEFAULTS: CameraRecommendationQueryParams = {
  status: "",
  camera_id: "",
  recommendation_type: "",
  severity: "",
  q: "",
  recommendation_id: "",
  detail: "open",
  limit: 25,
  offset: 0,
};

function activeRecommendationFilters(params: CameraRecommendationQueryParams) {
  return ["status", "camera_id", "recommendation_type", "severity", "q"].filter((key) => {
    const value = params[key as keyof CameraRecommendationQueryParams];
    return value !== undefined && value !== "";
  }).length;
}

function recommendationMatchesSearch(recommendation: CameraRecommendation, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const haystack = [
    recommendation.recommendation_id,
    recommendation.camera_id,
    recommendation.title,
    recommendation.reason,
    recommendation.recommendation_type,
    summarizeValue(recommendation.evidence),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function filterRecommendations(recommendations: CameraRecommendation[], params: CameraRecommendationQueryParams) {
  return recommendations.filter((recommendation) => {
    if (params.status && recommendation.status !== params.status) return false;
    if (params.camera_id && recommendation.camera_id !== params.camera_id) return false;
    if (params.recommendation_type && recommendation.recommendation_type !== params.recommendation_type) return false;
    if (params.severity && recommendation.severity !== params.severity) return false;
    return recommendationMatchesSearch(recommendation, params.q);
  });
}

export function CameraRecommendationsPage() {
  const { params, setParams, resetParams } = useQueryParams(CAMERA_RECOMMENDATION_DEFAULTS);
  const [draft, setDraft] = useState(params);
  const { data, loading, error, refresh } = useCameraRecommendations({
    status: params.status,
    camera_id: params.camera_id,
  });

  const filteredRecommendations = useMemo(
    () => filterRecommendations(data ?? [], params),
    [data, params],
  );
  const pagedRecommendations = filteredRecommendations.slice(params.offset, params.offset + params.limit);
  const currentRecommendationId =
    params.detail === "closed" ? null : params.recommendation_id || pagedRecommendations[0]?.recommendation_id || null;
  const {
    data: selectedRecommendation,
    loading: selectedLoading,
    error: selectedError,
    refresh: refreshSelected,
  } = useAsyncData<CameraRecommendation | null>(
    () => (currentRecommendationId ? api.getCameraRecommendation(currentRecommendationId) : Promise.resolve(null)),
    [currentRecommendationId],
  );

  useEffect(() => {
    setDraft(params);
  }, [params]);

  function refreshAll() {
    refresh();
    refreshSelected();
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setParams({ ...draft, recommendation_id: "", detail: "open", offset: 0 });
  }

  function clearFilters() {
    resetParams();
  }

  function setPage(nextOffset: number) {
    setParams({ offset: Math.max(0, nextOffset), recommendation_id: "", detail: "open" });
  }

  function filterByCamera(cameraId: string) {
    setParams({ camera_id: cameraId, recommendation_id: "", detail: "open", offset: 0 });
  }

  return (
    <div>
      <PageHeader
        title="Camera recommendations"
        description="Review, approve, reject, apply and roll back camera recognition recommendations from the API workflow."
        actions={
          <>
            <button className="btn" type="button" onClick={() => setParams({ status: "pending", recommendation_id: "", offset: 0 })}>
              Pending
            </button>
            <button className="btn" type="button" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </>
        }
      />

      <QueueQuickFilters
        filters={[
          { label: "All", active: !params.status, onClick: () => setParams({ status: "", recommendation_id: "", offset: 0 }) },
          { label: "Pending", active: params.status === "pending", onClick: () => setParams({ status: "pending", recommendation_id: "", offset: 0 }) },
          { label: "Approved", active: params.status === "approved", onClick: () => setParams({ status: "approved", recommendation_id: "", offset: 0 }) },
          { label: "Applied", active: params.status === "applied", onClick: () => setParams({ status: "applied", recommendation_id: "", offset: 0 }) },
          { label: "Failed", active: params.status === "failed", onClick: () => setParams({ status: "failed", recommendation_id: "", offset: 0 }) },
        ]}
      />

      <FilterBar title="Recommendation filters" activeCount={activeRecommendationFilters(params)} onReset={clearFilters}>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6" onSubmit={applyFilters}>
          <FormField label="Status">
            <select className="field" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
              <option value="">Any</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="applied">applied</option>
              <option value="failed">failed</option>
              <option value="rolled_back">rolled_back</option>
            </select>
          </FormField>
          <FormField label="Camera">
            <input className="field" value={draft.camera_id} onChange={(event) => setDraft({ ...draft, camera_id: event.target.value })} placeholder="camera_id" />
          </FormField>
          <FormField label="Type">
            <input
              className="field"
              value={draft.recommendation_type}
              onChange={(event) => setDraft({ ...draft, recommendation_type: event.target.value })}
              placeholder="face_tuning"
            />
          </FormField>
          <FormField label="Severity">
            <select className="field" value={draft.severity} onChange={(event) => setDraft({ ...draft, severity: event.target.value })}>
              <option value="">Any</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </FormField>
          <FormField label="Search">
            <input
              className="field"
              value={draft.q}
              onChange={(event) => setDraft({ ...draft, q: event.target.value })}
              placeholder="camera, id, title, reason"
            />
          </FormField>
          <FormField label="Page size">
            <select className="field" value={draft.limit} onChange={(event) => setDraft({ ...draft, limit: Number(event.target.value) })}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </FormField>
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-6">
            <button className="btn btn-primary w-full sm:w-auto" type="submit">
              Apply filters
            </button>
            <button className="btn w-full sm:w-auto" type="button" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </form>
      </FilterBar>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <StatusBadge value={`${filteredRecommendations.length} matching`} tone="info" />
        {params.camera_id ? <StatusBadge value={`camera: ${params.camera_id}`} tone="default" /> : null}
        {params.q ? <StatusBadge value={`search: ${params.q}`} tone="default" /> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
        <div>
          <DataState loading={loading} error={error} onRetry={refresh}>
            {pagedRecommendations.length === 0 ? (
              <EmptyState label="No camera recommendations match the current filters." />
            ) : (
              <>
                <CameraRecommendationList
                  recommendations={pagedRecommendations}
                  selectedId={currentRecommendationId}
                  onSelect={(recommendationId) => setParams({ recommendation_id: recommendationId, detail: "open" })}
                  onCameraFilter={filterByCamera}
                />
                <PaginationControls limit={params.limit} offset={params.offset} itemCount={pagedRecommendations.length} onPage={setPage} />
              </>
            )}
          </DataState>
        </div>

        <div>
          {selectedLoading && selectedRecommendation ? (
            <div className="mb-3 rounded border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">Refreshing recommendation detail...</div>
          ) : null}
          <DataState loading={selectedLoading && !selectedRecommendation} error={selectedError} onRetry={refreshSelected}>
            <CameraRecommendationDetail
              recommendation={selectedRecommendation}
              onChanged={refreshAll}
              onClose={() => setParams({ recommendation_id: "", detail: "closed" })}
            />
          </DataState>
        </div>
      </div>
    </div>
  );
}
