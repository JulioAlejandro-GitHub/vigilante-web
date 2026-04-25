import { ArrowRight, ClipboardList, FileText, RefreshCw, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "../api/vigilanteApi";
import { DataState } from "../components/DataState";
import { WorkQueueCard } from "../components/dashboard/WorkQueueCard";
import { PageHeader } from "../components/PageHeader";
import { useCurrentUser } from "../context/CurrentUserContext";
import { useAsyncData } from "../hooks/useAsyncData";
import type { DashboardSummary } from "../types/api";

export function DashboardPage() {
  const { currentUser } = useCurrentUser();
  const { data, loading, error, refresh } = useAsyncData(() => api.dashboardSummary(currentUser.username), [currentUser.username]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Current workload and quick entry points for ${currentUser.username}.`}
        actions={
          <button className="btn" type="button" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />
      <DataState loading={loading} error={error} onRetry={refresh}>
        {data ? <DashboardContent summary={data} currentUsername={currentUser.username} /> : null}
      </DataState>
    </div>
  );
}

function DashboardContent({ summary, currentUsername }: { summary: DashboardSummary; currentUsername: string }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WorkQueueCard
          label="My cases"
          value={summary.cases_assigned_to_user}
          to={`/cases?ownership=mine&assigned_to=${encodeURIComponent(currentUsername)}&limit=25&offset=0&sort_by=updated_at&sort_order=desc`}
          icon={FileText}
          description="Assigned to current user"
          tone="success"
        />
        <WorkQueueCard
          label="Open cases"
          value={summary.open_cases}
          to="/cases?status=open&limit=25&offset=0&sort_by=updated_at&sort_order=desc"
          icon={FileText}
          description="Active case intake"
        />
        <WorkQueueCard
          label="Pending reviews"
          value={summary.pending_manual_reviews}
          to="/manual-reviews?status=pending&limit=25&offset=0"
          icon={ClipboardList}
          description="Manual decisions waiting"
          tone="attention"
        />
        <WorkQueueCard
          label="Pending suggestions"
          value={summary.pending_case_suggestions}
          to="/case-suggestions?status=pending&limit=25&offset=0"
          icon={Search}
          description="Case candidates to triage"
          tone="attention"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="panel p-4">
          <h2 className="text-base font-semibold text-zinc-950">Case ownership</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <OwnershipMetric label="Total cases" value={summary.total_cases} />
            <OwnershipMetric label="Assigned" value={summary.assigned_cases} />
            <OwnershipMetric label="Unassigned" value={summary.unassigned_cases} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="btn" to={`/cases?ownership=mine&assigned_to=${encodeURIComponent(currentUsername)}&limit=25&offset=0&sort_by=updated_at&sort_order=desc`}>
              My cases
            </Link>
            <Link className="btn" to="/cases?ownership=unassigned&limit=25&offset=0&sort_by=updated_at&sort_order=desc">
              Unassigned
            </Link>
            <Link className="btn" to="/cases?limit=25&offset=0&sort_by=updated_at&sort_order=desc">
              All cases
            </Link>
          </div>
        </section>

        <section className="panel p-4">
          <h2 className="text-base font-semibold text-zinc-950">Operational shortcuts</h2>
          <div className="mt-4 grid gap-2">
            <Link className="btn justify-between" to="/manual-reviews?status=pending&limit=25&offset=0">
              Review pending items
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="btn justify-between" to="/case-suggestions?status=pending&limit=25&offset=0">
              Triage suggestions
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="btn justify-between" to="/timeline?limit=50">
              Audit timeline
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function OwnershipMetric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
      <div className="label">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-zinc-950">{value ?? "—"}</div>
    </div>
  );
}
