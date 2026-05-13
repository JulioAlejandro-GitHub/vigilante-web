import { ShieldAlert } from "lucide-react";

import type { ControlCenterEvidenceItem, RiskSignal } from "../types/controlCenter.types";
import type { CaseDetail, TimelineEvent } from "../../../types/api";
import { normalizeSeverityRank } from "./StatusBadges";

interface RiskRadarProps {
  caseDetail: CaseDetail | null;
  selectedEvent: TimelineEvent | null;
  evidence: ControlCenterEvidenceItem[];
}

export function RiskRadar({ caseDetail, selectedEvent, evidence }: RiskRadarProps) {
  const signals = buildSignals(caseDetail, selectedEvent, evidence);
  const knownValues = signals.map((signal) => signal.value).filter((value): value is number => value !== null);
  const score = knownValues.length ? Math.round(knownValues.reduce((sum, value) => sum + value, 0) / knownValues.length) : null;

  return (
    <section className="rounded border border-zinc-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">Análisis de riesgo</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Score compuesto desde señales disponibles.</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-950 text-sm font-semibold text-white">
          {score === null ? "—" : score}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {signals.map((signal) => (
          <div key={signal.key}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="inline-flex min-w-0 items-center gap-1 font-medium text-zinc-700">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
                <span className="truncate">{signal.label}</span>
              </span>
              <span className="font-semibold text-zinc-600">{signal.value === null ? "sin señal" : `${signal.value}/100`}</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-zinc-100">
              <div className={`h-full rounded ${barColor(signal.value)}`} style={{ width: `${signal.value ?? 0}%` }} />
            </div>
            <div className="mt-1 text-xs text-zinc-500">{signal.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildSignals(caseDetail: CaseDetail | null, selectedEvent: TimelineEvent | null, evidence: ControlCenterEvidenceItem[]): RiskSignal[] {
  const timeline = caseDetail?.timeline ?? (selectedEvent ? [selectedEvent] : []);
  const distinctCameras = new Set(timeline.map((event) => event.camera_id).filter(Boolean));
  const evidenceReady = evidence.filter((item) => item.resolved !== false && (item.content_url || item.thumbnail_url || item.proxy_url)).length;
  const evidenceTotal = evidence.length;
  const confidence = selectedEvent?.confidence ?? average(evidence.map((item) => item.control_center_score).filter((value): value is number => typeof value === "number"));
  const recurrence = Math.min(100, Math.max(0, timeline.length * 18));
  const severityScore = normalizeSeverityRank(String(caseDetail?.severity ?? selectedEvent?.severity)) * 25;

  return [
    {
      key: "facial_similarity",
      label: "Similitud facial",
      value: confidence === null ? null : normalizedPercent(confidence),
      detail: confidence === null ? "No hay score facial explícito." : "Usa confidence/match score expuesto por el pipeline.",
    },
    {
      key: "recurrence",
      label: "Recurrencia",
      value: timeline.length ? recurrence : null,
      detail: timeline.length ? `${timeline.length} evento(s) relacionados.` : "Sin timeline relacionado.",
    },
    {
      key: "spatial",
      label: "Coherencia espacial",
      value: distinctCameras.size ? Math.min(100, distinctCameras.size * 30) : null,
      detail: distinctCameras.size ? `${distinctCameras.size} cámara(s) involucradas.` : "Sin cámara asociada.",
    },
    {
      key: "context",
      label: "Contexto",
      value: severityScore || null,
      detail: "Derivado de la severidad operativa del caso/evento.",
    },
    {
      key: "evidence_quality",
      label: "Calidad de evidencia",
      value: evidenceTotal ? Math.round((evidenceReady / evidenceTotal) * 100) : null,
      detail: evidenceTotal ? `${evidenceReady}/${evidenceTotal} evidencias visuales renderizables.` : "Sin evidencia visual resuelta.",
    },
    {
      key: "pipeline",
      label: "Confianza pipeline",
      value: confidence === null ? null : normalizedPercent(confidence),
      detail: confidence === null ? "No se recibió confidence del evento." : "Score directo del evento seleccionado.",
    },
  ];
}

function normalizedPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value <= 1 ? value * 100 : value)));
}

function average(values: number[]) {
  if (!values.length) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function barColor(value: number | null) {
  if (value === null) return "bg-zinc-200";
  if (value >= 80) return "bg-rose-600";
  if (value >= 55) return "bg-amber-500";
  return "bg-emerald-600";
}
