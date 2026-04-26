import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ContextChips } from "../context/ContextChips";
import { EvidenceSummary } from "../evidence/EvidenceSummary";
import { Feedback } from "../Feedback";
import { FormField } from "../forms/FormField";
import { KeyValue } from "../KeyValue";
import { RoleAwareAction } from "../permissions/RoleAwareAction";
import { QueueActionPanel } from "../queues/QueueActionPanel";
import { StatusBadge, statusTone } from "../StatusBadge";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { api } from "../../api/vigilanteApi";
import type { CaseSuggestion } from "../../types/api";
import { payloadString as payloadFieldString } from "../../utils/evidence";
import { asErrorMessage, formatDateTime, shortId } from "../../utils/format";

interface SuggestionDetailPanelProps {
  suggestion: CaseSuggestion | null;
  returnTo: string;
  onChanged: () => void;
  onClose?: () => void;
}

function suggestedTitle(suggestion: CaseSuggestion | null) {
  const value = suggestion?.payload?.suggested_title;
  return typeof value === "string" && value.trim() ? value : "Recurring unidentified subject";
}

function payloadString(payload: Record<string, unknown>, key: string, fallback: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function SuggestionDetailPanel({ suggestion, returnTo, onChanged, onClose }: SuggestionDetailPanelProps) {
  const { currentUser, can } = useCurrentUser();
  const [decision, setDecision] = useState<"accepted" | "rejected" | "deferred">("accepted");
  const [reason, setReason] = useState("sufficient evidence for case creation");
  const [caseTitle, setCaseTitle] = useState(suggestedTitle(suggestion));
  const [caseType, setCaseType] = useState("unresolved_subject_case");
  const [priority, setPriority] = useState("medium");
  const [severity, setSeverity] = useState("medium");
  const [busy, setBusy] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setCaseTitle(suggestedTitle(suggestion));
    if (suggestion) {
      setReason(payloadString(suggestion.payload, "suggested_reason", "sufficient evidence for case creation"));
      setPriority(payloadString(suggestion.payload, "suggested_priority", "medium"));
      setSeverity(payloadString(suggestion.payload, "suggested_severity", "medium"));
    }
    setFormError(null);
    setError(null);
    setSuccess(null);
  }, [suggestion?.suggestion_id]);

  if (!suggestion) {
    return <div className="rounded border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">Select a case suggestion.</div>;
  }
  const currentSuggestion = suggestion;
  const relatedCaseId =
    suggestion.promoted_case_id ??
    payloadFieldString(suggestion.payload, ["case_id", "linked_case_id", "promoted_case_id"]) ??
    payloadFieldString(suggestion.resolution_payload, ["case_id", "linked_case_id", "promoted_case_id"]);

  async function run(label: string, action: () => Promise<unknown>) {
    if (busy) return;

    setBusy(label);
    setFormError(null);
    setError(null);
    setSuccess(null);
    try {
      await action();
      setSuccess(`${label} completed`);
      onChanged();
    } catch (caught) {
      setError(asErrorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  function resolve(event: FormEvent) {
    event.preventDefault();
    if (!can("suggestion:resolve", { organization_id: currentSuggestion.organization_id, site_id: currentSuggestion.site_id })) return;
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setFormError("Decision reason is required.");
      return;
    }
    void run("Resolve suggestion", () =>
      api.resolveCaseSuggestion(currentSuggestion.suggestion_id, { decision, decision_reason: trimmedReason, resolved_by: currentUser.username }),
    );
  }

  function promote() {
    if (!can("suggestion:promote", { organization_id: currentSuggestion.organization_id, site_id: currentSuggestion.site_id })) return;
    const trimmedTitle = caseTitle.trim();
    const trimmedCaseType = caseType.trim();
    if (!trimmedTitle || !trimmedCaseType) {
      setFormError("Title and case type are required before promotion.");
      return;
    }
    void run("Promote to case", () =>
      api.promoteCaseSuggestion(currentSuggestion.suggestion_id, {
        resolved_by: currentUser.username,
        case_type: trimmedCaseType,
        title: trimmedTitle,
        priority,
        severity,
        case_payload: { created_from: "vigilante-web" },
      }),
    );
  }

  return (
    <QueueActionPanel
      title="Suggestion detail"
      subtitle={`${shortId(suggestion.suggestion_id)} · acting as ${currentUser.username}`}
      status={<StatusBadge value={suggestion.status} tone={statusTone(suggestion.status)} />}
    >
      {onClose ? (
        <div className="mb-4 flex justify-end">
          <button className="btn px-2 py-1 text-xs" type="button" onClick={onClose}>
            Close detail
          </button>
        </div>
      ) : null}
      <div className="mb-4">
        <ContextChips organizationId={suggestion.organization_id} siteId={suggestion.site_id} showEmpty />
      </div>
      <div className="grid gap-3">
        <KeyValue label="Type" value={suggestion.suggestion_type} />
        <KeyValue label="Evidence" value={suggestion.evidence_count} />
        <KeyValue label="Subject" value={shortId(suggestion.subject_id)} />
        <KeyValue label="Track" value={shortId(suggestion.track_id)} />
        <KeyValue label="Camera" value={shortId(suggestion.camera_id)} />
        <KeyValue label="Organization" value={shortId(suggestion.organization_id)} />
        <KeyValue label="Site" value={shortId(suggestion.site_id)} />
        <KeyValue label="Event time" value={formatDateTime(suggestion.event_ts)} />
        <KeyValue
          label="Source event"
          value={
            suggestion.source_event_id ? (
              <Link className="text-teal-800 underline-offset-2 hover:underline" to={`/timeline/${suggestion.source_event_id}?returnTo=${encodeURIComponent(returnTo)}`}>
                {shortId(suggestion.source_event_id)}
              </Link>
            ) : (
              "—"
            )
          }
        />
        <KeyValue label="Reason" value={suggestion.reason_summary} />
        {relatedCaseId ? (
          <KeyValue
            label="Related case"
            value={
              <Link className="text-teal-800 underline-offset-2 hover:underline" to={`/cases/${relatedCaseId}?returnTo=${encodeURIComponent(returnTo)}`}>
                {shortId(relatedCaseId)}
              </Link>
            }
          />
        ) : null}
      </div>

      <div className="mt-5 border-t border-zinc-200 pt-4">
        <EvidenceSummary payload={suggestion.payload} sourceEventId={suggestion.source_event_id} />
      </div>

      <form className="mt-5 space-y-3 border-t border-zinc-200 pt-4" onSubmit={resolve}>
        <Feedback error={formError ?? error} success={success} />
        <FormField label="Decision">
          <select className="field" value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)}>
            <option value="accepted">accepted</option>
            <option value="rejected">rejected</option>
            <option value="deferred">deferred</option>
          </select>
        </FormField>
        <FormField label="Decision reason">
          <input className="field" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="sufficient evidence" />
        </FormField>
        <RoleAwareAction permission="suggestion:resolve" resourceContext={{ organization_id: suggestion.organization_id, site_id: suggestion.site_id }}>
          {({ disabled, reason: unavailableReason }) => (
            <button
              className="btn btn-primary w-full"
              type="submit"
              disabled={busy !== null || disabled || !reason.trim()}
              title={unavailableReason ?? undefined}
            >
              {busy === "Resolve suggestion" ? "Resolving..." : "Resolve suggestion"}
            </button>
          )}
        </RoleAwareAction>
      </form>

      <div className="mt-5 space-y-3 border-t border-zinc-200 pt-4">
        <FormField label="Case title">
          <input className="field" value={caseTitle} onChange={(event) => setCaseTitle(event.target.value)} placeholder="Case title" />
        </FormField>
        <FormField label="Case type">
          <input className="field" value={caseType} onChange={(event) => setCaseType(event.target.value)} placeholder="case_type" />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <FormField label="Priority">
            <select className="field" value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="critical">critical</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </FormField>
          <FormField label="Severity">
            <select className="field" value={severity} onChange={(event) => setSeverity(event.target.value)}>
              <option value="critical">critical</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </FormField>
        </div>
        <RoleAwareAction permission="suggestion:promote" resourceContext={{ organization_id: suggestion.organization_id, site_id: suggestion.site_id }}>
          {({ disabled, reason: unavailableReason }) => (
            <button
              className="btn w-full"
              type="button"
              disabled={busy !== null || disabled || !caseTitle.trim() || !caseType.trim()}
              onClick={promote}
              title={unavailableReason ?? undefined}
            >
              {busy === "Promote to case" ? "Promoting..." : "Promote to case"}
            </button>
          )}
        </RoleAwareAction>
      </div>
    </QueueActionPanel>
  );
}
