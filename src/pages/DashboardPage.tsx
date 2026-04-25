import { RefreshCw } from "lucide-react";

import { api } from "../api/vigilanteApi";
import { DataState } from "../components/DataState";
import { PageHeader } from "../components/PageHeader";
import { useAsyncData } from "../hooks/useAsyncData";

const metricLabels = [
  { key: "open_cases", label: "Open cases" },
  { key: "under_review_cases", label: "Under review" },
  { key: "pending_manual_reviews", label: "Pending reviews" },
  { key: "pending_case_suggestions", label: "Pending suggestions" },
] as const;

export function DashboardPage() {
  const { data, loading, error, refresh } = useAsyncData(() => api.dashboardSummary(), []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Current case workload and queues from vigilante-api."
        actions={
          <button className="btn" type="button" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />
      <DataState loading={loading} error={error}>
        {data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metricLabels.map((metric) => (
              <section key={metric.key} className="panel p-4">
                <div className="text-sm font-medium text-zinc-500">{metric.label}</div>
                <div className="mt-3 text-3xl font-semibold text-zinc-950">{data[metric.key]}</div>
              </section>
            ))}
            <section className="panel p-4 sm:col-span-2 lg:col-span-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="label">Total cases</div>
                  <div className="mt-1 text-lg font-semibold">{data.total_cases}</div>
                </div>
                <div>
                  <div className="label">Assigned cases</div>
                  <div className="mt-1 text-lg font-semibold">{data.assigned_cases}</div>
                </div>
                <div>
                  <div className="label">Unassigned cases</div>
                  <div className="mt-1 text-lg font-semibold">{data.unassigned_cases}</div>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </DataState>
    </div>
  );
}
