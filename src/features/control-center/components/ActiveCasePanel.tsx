import { AlertTriangle, Camera, Clock3, FileText, MapPin, UserRound } from "lucide-react";

import { CaseTimeline } from "./CaseTimeline";
import { EvidenceReel } from "./EvidenceReel";
import { OperatorActionsPanel } from "./OperatorActionsPanel";
import { RecognitionInsightPanel } from "./RecognitionInsightPanel";
import { ConfidenceBadge, SeverityBadge } from "./StatusBadges";
import { EmptyState } from "../../../components/DataState";
import { StatusBadge, statusTone } from "../../../components/StatusBadge";
import { useCaseEvidence } from "../hooks/useCaseEvidence";
import type { ControlCenterCaseBundle, ControlCenterEventGroup } from "../types/controlCenter.types";
import { subjectDisplayName, visualEventSummary } from "../utils/priority";
import { formatDateTime, shortId } from "../../../utils/format";
import { payloadString } from "../../../utils/evidence";

interface ActiveCasePanelProps {
  selectedGroup: ControlCenterEventGroup | null;
  caseBundle: ControlCenterCaseBundle;
  onChanged: () => void;
}

export function ActiveCasePanel({ selectedGroup, caseBundle, onChanged }: ActiveCasePanelProps) {
  const selectedEvent = selectedGroup?.event ?? null;
  const { detail, timeline, evidence: resolvedEvidence, loading, refreshing, error, evidenceError, refresh } = caseBundle;
  const evidence = useCaseEvidence({ caseDetail: detail, selectedEvent, resolvedEvidence });

  if (!selectedGroup || !selectedEvent) {
    return (
      <section className="panel p-4">
        <EmptyState label="Seleccione un evento para ver el caso activo, su evidencia y acciones." />
      </section>
    );
  }

  if (loading) {
    return (
      <section className="panel p-4">
        <div className="h-7 w-56 animate-pulse rounded bg-zinc-200" />
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.7fr)]">
          <div className="aspect-video animate-pulse rounded bg-zinc-100" />
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded bg-zinc-100" />
            <div className="h-40 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
      </section>
    );
  }

  const caseId = detail?.case_id || selectedEvent.case_id;
  const subjectName = subjectDisplayName(selectedEvent);
  const cameras = Array.from(new Set((timeline.length ? timeline : selectedGroup.groupedEvents).map((event) => event.camera_id).filter(Boolean)));
  const semanticDescription = visualEventSummary(selectedEvent, payloadString(detail?.case_payload, ["semantic_summary", "description", "reason_summary", "suggested_reason"]));
  const openedReason = payloadString(detail?.case_payload, ["suggested_reason", "reason_summary", "opened_reason", "source_suggestion_type"]) || selectedGroup.priority.primaryReason;

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-950">{detail?.case_code ?? "Evento activo sin caso"}</h2>
              {detail ? <StatusBadge value={detail.status} tone={statusTone(detail.status)} /> : null}
              <SeverityBadge severity={detail?.severity ?? selectedEvent.severity} />
              <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-600">
                {selectedGroup.priority.sightingsCount} avistamientos
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span>{caseId ? shortId(caseId) : "sin case_id"}</span>
              <span>{selectedGroup.priority.eventLabel}</span>
              <span>{formatDateTime(selectedEvent.event_ts)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ConfidenceBadge value={selectedEvent.confidence} />
            <span className="rounded bg-zinc-950 px-3 py-2 text-sm font-semibold text-white">
              riesgo {selectedGroup.priority.score}
            </span>
          </div>
        </div>
      </div>

      {refreshing ? <div className="border-b border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700">Actualizando detalle del caso activo...</div> : null}

      {error ? (
        <div className="border-b border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Caso no encontrado o no autorizado
          </div>
          <p className="mt-1">{error}</p>
          <button className="btn mt-3" type="button" onClick={refresh}>
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
        <div className="min-w-0 space-y-4">
          <EvidenceReel
            items={evidence.items}
            visibleItems={evidence.visibleItems}
            selectedItem={evidence.selectedItem}
            selectedIndex={evidence.selectedIndex}
            loading={caseBundle.evidenceLoading || loading || refreshing}
            canShowMore={caseBundle.evidenceHasMore || evidence.canShowMore}
            onSelect={evidence.setSelectedIndex}
            onShowMore={caseBundle.evidenceHasMore ? caseBundle.loadMoreEvidence : evidence.showMore}
            onRefreshEvidence={refresh}
            loadingMore={caseBundle.evidenceLoading || caseBundle.evidenceLoadingMore}
            error={evidenceError}
          />

          <CaseTimeline
            events={timeline.length ? timeline : selectedGroup.groupedEvents}
            loading={caseBundle.timelineLoading}
            loadingMore={caseBundle.timelineLoadingMore}
            canLoadMore={caseBundle.timelineHasMore}
            onLoadMore={caseBundle.loadMoreTimeline}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <section className="rounded border border-zinc-200 bg-white p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <Fact icon={<UserRound className="h-4 w-4" />} label="Sujeto" value={subjectName} />
              <Fact icon={<Camera className="h-4 w-4" />} label="Cámara actual" value={shortId(selectedEvent.camera_id)} />
              <Fact icon={<FileText className="h-4 w-4" />} label="Evento" value={shortId(selectedEvent.source_event_id)} />
              <Fact icon={<Clock3 className="h-4 w-4" />} label="Hora" value={formatDateTime(selectedEvent.event_ts)} />
            </div>
            {cameras.length > 0 ? (
              <div className="mt-3">
                <div className="text-xs font-semibold uppercase text-zinc-500">Cámaras relacionadas</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cameras.slice(0, 6).map((cameraId) => (
                    <span key={cameraId} className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {shortId(cameraId)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-3">
              <div className="text-xs font-semibold uppercase text-zinc-500">Qué está pasando</div>
              <p className="mt-1 text-sm text-zinc-900">{semanticDescription}</p>
            </div>
            <div className="mt-3 rounded border border-zinc-200 bg-white p-3">
              <div className="text-xs font-semibold uppercase text-zinc-500">Razón de relevancia</div>
              <p className="mt-1 text-sm text-zinc-700">{openedReason}</p>
            </div>
          </section>

          <RecognitionInsightPanel selectedGroup={selectedGroup} caseDetail={detail} evidence={evidence.items} />

          <OperatorActionsPanel
            caseDetail={detail}
            selectedEvent={selectedEvent}
            resourceContext={{ organization_id: detail?.organization_id, site_id: detail?.site_id }}
            onChanged={() => {
              refresh();
              onChanged();
            }}
          />
        </div>
      </div>
    </section>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-zinc-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 truncate font-semibold text-zinc-900">{value}</div>
    </div>
  );
}
