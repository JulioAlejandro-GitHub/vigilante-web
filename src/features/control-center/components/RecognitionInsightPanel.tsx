import { BrainCircuit, CheckCircle2, Eye, MapPinned, ShieldAlert, Timer, UserRound } from "lucide-react";

import { ConfidenceBadge } from "./StatusBadges";
import type { ControlCenterEvidenceItem, ControlCenterEventGroup } from "../types/controlCenter.types";
import { visualEventSummary } from "../utils/priority";
import type { CaseDetail, TimelineEvent } from "../../../types/api";
import { formatDateTime, shortId } from "../../../utils/format";

interface RecognitionInsightPanelProps {
  selectedGroup: ControlCenterEventGroup;
  caseDetail: CaseDetail | null;
  evidence: ControlCenterEvidenceItem[];
}

export function RecognitionInsightPanel({ selectedGroup, caseDetail, evidence }: RecognitionInsightPanelProps) {
  const selectedEvent = selectedGroup.event;
  const events = caseDetail?.timeline?.length ? caseDetail.timeline : selectedGroup.groupedEvents;
  const cameras = Array.from(new Set(events.map((event) => event.camera_id).filter(Boolean)));
  const evidenceReady = evidence.filter((item) => item.resolved !== false && (item.content_url || item.thumbnail_url || item.proxy_url)).length;
  const evidenceQuality = evidence.length ? Math.round((evidenceReady / evidence.length) * 100) : null;
  const timeWindow = describeTimeWindow(events);

  return (
    <section className="rounded border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-zinc-950">Insight de recognition</h3>
          </div>
          <p className="mt-1 text-sm text-zinc-700">{selectedGroup.priority.recognitionSummary}</p>
        </div>
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded bg-zinc-950 text-white">
          <span className="text-lg font-semibold">{selectedGroup.priority.score}</span>
          <span className="text-[10px] uppercase text-zinc-400">riesgo</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InsightItem icon={<ShieldAlert className="h-4 w-4" />} label="Prioridad" value={selectedGroup.priority.primaryReason} />
        <InsightItem
          icon={<Eye className="h-4 w-4" />}
          label="Rostro"
          value={
            selectedGroup.priority.hasUsableUnknownFace || selectedGroup.priority.hasUsefulMatch
              ? "Rostro usable"
              : selectedGroup.priority.recognitionSummary.toLowerCase().includes("sin rostro usable")
                ? "Sin rostro usable"
                : "Sin señal explícita"
          }
        />
        <InsightItem
          icon={<UserRound className="h-4 w-4" />}
          label="Identidad"
          value={selectedGroup.priority.hasUsefulMatch ? "Identidad candidata detectada" : "No identificada o pendiente"}
          badge={<ConfidenceBadge value={selectedEvent.confidence} />}
        />
        <InsightItem
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Recurrencia"
          value={`${selectedGroup.priority.sightingsCount} avistamiento(s) relacionados`}
        />
        <InsightItem icon={<Timer className="h-4 w-4" />} label="Coherencia temporal" value={timeWindow} />
        <InsightItem icon={<MapPinned className="h-4 w-4" />} label="Coherencia espacial" value={`${cameras.length || 1} cámara(s): ${cameras.slice(0, 3).map(shortId).join(", ") || shortId(selectedEvent.camera_id)}`} />
      </div>

      <div className="mt-4 space-y-3">
        <SignalBar label="Evidencia visual usable" value={evidenceQuality} detail={evidence.length ? `${evidenceReady}/${evidence.length} evidencias renderizables` : "se carga bajo demanda"} />
        <SignalBar label="Confianza del match/detección" value={normalizedPercent(selectedEvent.confidence)} detail={selectedEvent.confidence === null ? "sin confidence explícita" : "señal recognition disponible"} />
        <SignalBar label="Relevancia operacional" value={selectedGroup.priority.score} detail={selectedGroup.priority.reasons.join(" · ")} />
      </div>

      <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-3">
        <div className="text-xs font-semibold uppercase text-zinc-500">Descripción operacional</div>
        <p className="mt-1 text-sm text-zinc-900">{visualEventSummary(selectedEvent, caseDetail?.case_payload?.semantic_summary as string | undefined)}</p>
      </div>
    </section>
  );
}

function InsightItem({ icon, label, value, badge }: { icon: React.ReactNode; label: string; value: string; badge?: React.ReactNode }) {
  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-zinc-500">
          {icon}
          {label}
        </div>
        {badge}
      </div>
      <div className="mt-1 line-clamp-2 text-sm font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

function SignalBar({ label, value, detail }: { label: string; value: number | null; detail: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-zinc-700">{label}</span>
        <span className="font-semibold text-zinc-600">{value === null ? "sin señal" : `${value}/100`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-zinc-100">
        <div className={`h-full rounded ${barColor(value)}`} style={{ width: `${value ?? 0}%` }} />
      </div>
      <div className="mt-1 text-xs text-zinc-500">{detail}</div>
    </div>
  );
}

function describeTimeWindow(events: TimelineEvent[]) {
  if (events.length <= 1) {
    return events[0]?.event_ts ? `evento único ${formatDateTime(events[0].event_ts)}` : "sin ventana temporal";
  }
  const timestamps = events.map((event) => new Date(event.event_ts).getTime()).filter(Number.isFinite).sort((left, right) => left - right);
  if (!timestamps.length) {
    return `${events.length} eventos relacionados`;
  }
  const minutes = Math.round((timestamps[timestamps.length - 1] - timestamps[0]) / 60000);
  if (minutes <= 15) return `${events.length} eventos concentrados en ${Math.max(1, minutes)} min`;
  if (minutes < 180) return `${events.length} eventos en ${Math.round(minutes / 60)} h`;
  return `${events.length} eventos entre ${formatDateTime(new Date(timestamps[0]).toISOString())} y ${formatDateTime(new Date(timestamps[timestamps.length - 1]).toISOString())}`;
}

function normalizedPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(value <= 1 ? value * 100 : value)));
}

function barColor(value: number | null) {
  if (value === null) return "bg-zinc-200";
  if (value >= 80) return "bg-rose-600";
  if (value >= 55) return "bg-amber-500";
  return "bg-emerald-600";
}
