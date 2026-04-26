import { RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { api } from "../api/vigilanteApi";
import { DataState } from "../components/DataState";
import { FilterBar } from "../components/filters/FilterBar";
import { FormField } from "../components/forms/FormField";
import { PageHeader } from "../components/PageHeader";
import { TimelineList } from "../components/TimelineList";
import { useAsyncData } from "../hooks/useAsyncData";
import { useQueryParams } from "../hooks/useQueryParams";
import type { TimelineEvent, TimelineListParams } from "../types/api";

type TimelineQueryParams = {
  event_type: string;
  camera_id: string;
  subject_id: string;
  case_id: string;
  source_event_id: string;
  organization_id: string;
  site_id: string;
  limit: number;
};

const TIMELINE_DEFAULTS: TimelineQueryParams = {
  event_type: "",
  camera_id: "",
  subject_id: "",
  case_id: "",
  source_event_id: "",
  organization_id: "",
  site_id: "",
  limit: 50,
};

function activeTimelineFilters(params: TimelineQueryParams) {
  return ["event_type", "camera_id", "subject_id", "case_id", "source_event_id", "organization_id", "site_id"].filter((key) => {
    const value = params[key as keyof TimelineQueryParams];
    return value !== undefined && value !== "";
  }).length;
}

export function TimelinePage() {
  const { params, setParams, resetParams } = useQueryParams(TIMELINE_DEFAULTS);
  const [draft, setDraft] = useState(params);
  const filters = useMemo<TimelineListParams>(
    () => ({
      event_type: params.event_type,
      camera_id: params.camera_id,
      subject_id: params.subject_id,
      case_id: params.case_id,
      organization_id: params.organization_id,
      site_id: params.site_id,
      limit: params.limit,
    }),
    [params],
  );
  const { data, loading, error, refresh } = useAsyncData<TimelineEvent[]>(
    async () => (params.source_event_id ? [await api.getTimelineEvent(params.source_event_id)] : api.listTimeline(filters)),
    [params.source_event_id, JSON.stringify(filters)],
  );

  useEffect(() => {
    setDraft(params);
  }, [params]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setParams(draft);
  }

  return (
    <div>
      <PageHeader
        title="Timeline"
        description="Forensic audit stream with links back to cases, queue items and source events."
        actions={
          <button className="btn" type="button" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />
      <FilterBar title="Timeline filters" activeCount={activeTimelineFilters(params)} onReset={resetParams}>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6" onSubmit={applyFilters}>
          <FormField label="Event type">
            <input className="field" value={draft.event_type} onChange={(event) => setDraft({ ...draft, event_type: event.target.value })} placeholder="case_assigned" />
          </FormField>
          <FormField label="Source event">
            <input
              className="field"
              value={draft.source_event_id}
              onChange={(event) => setDraft({ ...draft, source_event_id: event.target.value })}
              placeholder="source_event_id"
            />
          </FormField>
          <FormField label="Case ID">
            <input className="field" value={draft.case_id} onChange={(event) => setDraft({ ...draft, case_id: event.target.value })} placeholder="case_id" />
          </FormField>
          <FormField label="Camera">
            <input className="field" value={draft.camera_id} onChange={(event) => setDraft({ ...draft, camera_id: event.target.value })} placeholder="camera_id" />
          </FormField>
          <FormField label="Subject">
            <input className="field" value={draft.subject_id} onChange={(event) => setDraft({ ...draft, subject_id: event.target.value })} placeholder="subject_id" />
          </FormField>
          <FormField label="Organization">
            <input
              className="field"
              value={draft.organization_id}
              onChange={(event) => setDraft({ ...draft, organization_id: event.target.value })}
              placeholder="organization_id"
            />
          </FormField>
          <FormField label="Site">
            <input className="field" value={draft.site_id} onChange={(event) => setDraft({ ...draft, site_id: event.target.value })} placeholder="site_id" />
          </FormField>
          <FormField label="Limit">
            <select className="field" value={draft.limit} onChange={(event) => setDraft({ ...draft, limit: Number(event.target.value) })}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </FormField>
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-6">
            <button className="btn btn-primary w-full sm:w-auto" type="submit">
              Apply filters
            </button>
            <button className="btn w-full sm:w-auto" type="button" onClick={resetParams}>
              Clear
            </button>
          </div>
        </form>
      </FilterBar>
      <DataState loading={loading} error={error} onRetry={refresh}>
        <TimelineList items={data ?? []} />
      </DataState>
    </div>
  );
}
