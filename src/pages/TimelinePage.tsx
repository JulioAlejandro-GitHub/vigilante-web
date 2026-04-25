import { RefreshCw } from "lucide-react";
import { FormEvent, useState } from "react";

import { api } from "../api/vigilanteApi";
import { DataState } from "../components/DataState";
import { PageHeader } from "../components/PageHeader";
import { TimelineList } from "../components/TimelineList";
import { useAsyncData } from "../hooks/useAsyncData";

export function TimelinePage() {
  const [filters, setFilters] = useState({ event_type: "", limit: 50 });
  const [draftEventType, setDraftEventType] = useState("");
  const { data, loading, error, refresh } = useAsyncData(() => api.listTimeline(filters), [JSON.stringify(filters)]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setFilters({ event_type: draftEventType, limit: 50 });
  }

  return (
    <div>
      <PageHeader
        title="Timeline"
        description="General audit timeline from vigilante-api."
        actions={
          <button className="btn" type="button" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />
      <form className="panel mb-4 flex flex-col gap-3 p-4 sm:flex-row" onSubmit={applyFilters}>
        <input className="field" placeholder="Event type" value={draftEventType} onChange={(event) => setDraftEventType(event.target.value)} />
        <button className="btn btn-primary sm:w-32" type="submit">
          Apply
        </button>
      </form>
      <DataState loading={loading} error={error}>
        <TimelineList items={data ?? []} />
      </DataState>
    </div>
  );
}
