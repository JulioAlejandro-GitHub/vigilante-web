import { ArrowRight, ClipboardList, FileText, RefreshCw, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "../api/vigilanteApi";
import { DataState } from "../components/DataState";
import { PageHeader } from "../components/PageHeader";
import { useAsyncData } from "../hooks/useAsyncData";
import type { DashboardSummary } from "../types/api";

const metricCards = [
  { key: "open_cases", label: "Open cases", to: "/cases?status=open&limit=25&offset=0&sort_by=updated_at&sort_order=desc", icon: FileText },
  {
    key: "under_review_cases",
    label: "Under review",
    to: "/cases?status=in_review&limit=25&offset=0&sort_by=updated_at&sort_order=desc",
    icon: FileText,
  },
  { key: "pending_manual_reviews", label: "Pending reviews", to: "/manual-reviews?status=pending&limit=25&offset=0", icon: ClipboardList },
  { key: "pending_case_suggestions", label: "Pending suggestions", to: "/case-suggestions?status=pending&limit=25&offset=0", icon: Search },
] as const;

export function DashboardPage() {
  const { data, loading, error, refresh } = useAsyncData(() => api.dashboardSummary(), []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Current workload and quick entry points for analyst operations."
        actions={
          <button className="btn" type="button" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />
      <DataState loading={loading} error={error} onRetry={refresh}>
        {data ? <DashboardContent summary={data} /> : null}
      </DataState>
    </div>
  );
}

function DashboardContent({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link key={metric.key} className="panel group block p-4 hover:border-teal-200 hover:bg-teal-50/30" to={metric.to}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-zinc-500">{metric.label}</div>
                  <div className="mt-3 text-3xl font-semibold text-zinc-950">{summary[metric.key]}</div>
                </div>
                <div className="rounded bg-zinc-100 p-2 text-zinc-600 group-hover:bg-teal-100 group-hover:text-teal-800">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal-800">
                Open queue
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          );
        })}
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
            <Link className="btn" to="/cases?assigned_to=julio&limit=25&offset=0&sort_by=updated_at&sort_order=desc">
              My cases
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
