import { AlertTriangle, Camera, FileText, UserRound } from "lucide-react";

import { CaseTimeline } from "./CaseTimeline";
import { EvidenceReel } from "./EvidenceReel";
import { OperatorActions } from "./OperatorActions";
import { RiskRadar } from "./RiskRadar";
import { ConfidenceBadge, SeverityBadge } from "./StatusBadges";
import { EmptyState } from "../../../components/DataState";
import { StatusBadge, statusTone } from "../../../components/StatusBadge";
import { useCaseEvidence } from "../hooks/useCaseEvidence";
import type { ControlCenterCaseBundle, ControlCenterEventGroup } from "../types/controlCenter.types";
import { formatDateTime, shortId } from "../../../utils/format";
import { asRecord, payloadString, summarizeValue } from "../../../utils/evidence";

interface CaseDetailPanelProps {
  selectedGroup: ControlCenterEventGroup | null;
  caseBundle: ControlCenterCaseBundle;
  onChanged: () => void;
}

export function CaseDetailPanel({ selectedGroup, caseBundle, onChanged }: CaseDetailPanelProps) {
  const selectedEvent = selectedGroup?.event ?? null;
  const { detail, loading, refreshing, error, refresh } = caseBundle;
  const evidence = useCaseEvidence({ caseDetail: detail, selectedEvent });

  if (!selectedEvent) {
    return (
      <aside className="space-y-4">
        <section className="panel p-4">
          <EmptyState label="Seleccione un evento para ver el caso y su evidencia visual." />
        </section>
      </aside>
    );
  }

  if (loading) {
    return (
      <aside className="space-y-4">
        <section className="panel p-4">
          <div className="h-7 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="mt-4 aspect-video animate-pulse rounded bg-zinc-100" />
          <div className="mt-4 space-y-2">
            <div className="h-4 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
          </div>
        </section>
      </aside>
    );
  }

  const activeGroup = selectedGroup!;
  const subjectId = detail?.primary_subject_id || selectedEvent.subject_id;
  const identity = identityLabel(selectedEvent);
  const caseId = detail?.case_id || selectedEvent.case_id;
  const semanticDescription = semanticSummary(detail?.case_payload, selectedEvent);
  const openedReason = openedReasonText(detail?.case_payload, selectedEvent);

  return (
    <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
      {refreshing ? <div className="rounded border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">Actualizando detalle del caso...</div> : null}

      {error ? (
        <section className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Caso no encontrado o no autorizado
          </div>
          <p className="mt-1">{error}</p>
          <button className="btn mt-3" type="button" onClick={refresh}>
            Reintentar
          </button>
        </section>
      ) : null}

      <section className="panel p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-zinc-950">{detail?.case_code ?? "Evento sin caso"}</h2>
              {detail ? <StatusBadge value={detail.status} tone={statusTone(detail.status)} /> : null}
              <SeverityBadge severity={detail?.severity ?? selectedEvent.severity} />
            </div>
            <div className="mt-1 text-xs text-zinc-500">{caseId ? shortId(caseId) : "Sin case_id asociado"}</div>
          </div>
          <ConfidenceBadge value={selectedEvent.confidence} />
        </div>

        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <Fact icon={<UserRound className="h-4 w-4" />} label="Sujeto" value={identity || shortId(subjectId)} />
          <Fact icon={<Camera className="h-4 w-4" />} label="Cámara" value={shortId(selectedEvent.camera_id)} />
          <Fact icon={<FileText className="h-4 w-4" />} label="Evento" value={shortId(selectedEvent.source_event_id)} />
          <Fact label="Hora" value={formatDateTime(selectedEvent.event_ts)} />
        </div>

        <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-3">
          <div className="text-xs font-semibold uppercase text-zinc-500">Qué está pasando</div>
          <p className="mt-1 text-sm text-zinc-900">{semanticDescription}</p>
        </div>

        <div className="mt-3 rounded border border-zinc-200 bg-white p-3">
          <div className="text-xs font-semibold uppercase text-zinc-500">Motivo de apertura</div>
          <p className="mt-1 text-sm text-zinc-700">{openedReason}</p>
        </div>
      </section>

      <EvidenceReel
        items={evidence.items}
        visibleItems={evidence.visibleItems}
        selectedItem={evidence.selectedItem}
        selectedIndex={evidence.selectedIndex}
        loading={loading || refreshing}
        canShowMore={evidence.canShowMore}
        onSelect={evidence.setSelectedIndex}
        onShowMore={evidence.showMore}
        onRefreshEvidence={refresh}
      />

      <RiskRadar caseDetail={detail} selectedEvent={selectedEvent} evidence={evidence.items} />

      {detail ? <CaseTimeline events={detail.timeline.length ? detail.timeline : activeGroup.groupedEvents} /> : null}

      <OperatorActions
        caseId={detail?.case_id ?? null}
        resourceContext={{ organization_id: detail?.organization_id, site_id: detail?.site_id }}
        onChanged={() => {
          refresh();
          onChanged();
        }}
      />
    </aside>
  );
}

function Fact({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
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

function identityLabel(event: NonNullable<ControlCenterEventGroup["event"]>) {
  const payload = event.payload ?? {};
  const knownName = payloadString(payload, ["identity_name", "person_name", "candidate_name", "matched_name"]);
  if (knownName) return knownName;
  const personProfile = payloadString(payload, ["person_profile_id", "matched_person_profile_id"]);
  if (personProfile) return `Identidad ${shortId(personProfile)}`;
  const observed = event.subject_id || payloadString(payload, ["observed_subject_id", "subject_id"]);
  return observed ? `Sujeto Observado ${shortId(observed)}` : "Sujeto no identificado";
}

function semanticSummary(casePayload: Record<string, unknown> | undefined, event: ControlCenterEventGroup["event"]) {
  const descriptor = asRecord(event.payload?.semantic_descriptor);
  const semantic = descriptor ? payloadString(descriptor, ["summary", "description", "caption"]) : null;
  return (
    semantic ||
    payloadString(event.payload, ["semantic_summary", "description", "reason_summary", "suggested_reason"]) ||
    payloadString(casePayload ?? {}, ["semantic_summary", "description", "reason_summary", "suggested_reason"]) ||
    event.summary ||
    summarizeValue(event.payload)
  );
}

function openedReasonText(casePayload: Record<string, unknown> | undefined, event: ControlCenterEventGroup["event"]) {
  return (
    payloadString(casePayload ?? {}, ["suggested_reason", "reason_summary", "opened_reason", "source_suggestion_type"]) ||
    payloadString(event.payload, ["reason_summary", "review_reason", "suggested_reason"]) ||
    event.event_type
  );
}
