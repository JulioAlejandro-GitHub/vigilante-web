import { ArrowRight, ClipboardList, FileText, RefreshCw, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

import { assignedToMeCaseParams } from "../api/filterHelpers";
import { api } from "../api/vigilanteApi";
import { ContextChips } from "../components/context/ContextChips";
import { DataState, EmptyState } from "../components/DataState";
import { WorkQueueCard } from "../components/dashboard/WorkQueueCard";
import { PageHeader } from "../components/PageHeader";
import { RoleAwareAction } from "../components/permissions/RoleAwareAction";
import { SessionSummaryCard } from "../components/session/SessionSummaryCard";
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { useAsyncData } from "../hooks/useAsyncData";
import { useCurrentUser } from "../hooks/useCurrentUser";
import type { CaseRecord, CaseSuggestion, DashboardSummary, ManualReview } from "../types/api";
import { formatDateTime, shortId } from "../utils/format";
import { matchesSessionContext } from "../utils/ownership";

interface MyWorkBundle {
  summary: DashboardSummary;
  assignedCases: CaseRecord[];
  underReviewCases: CaseRecord[];
  pendingReviews: ManualReview[];
  pendingSuggestions: CaseSuggestion[];
}

export function MyWorkPage() {
  const location = useLocation();
  const { currentUser } = useCurrentUser();
  const { data, loading, error, refresh } = useAsyncData<MyWorkBundle>(
    async () => {
      const [summary, assignedCases, underReviewCases, pendingReviews, pendingSuggestions] = await Promise.all([
        api.dashboardSummary(currentUser.username),
        api.listCases(assignedToMeCaseParams(currentUser.username)),
        api.listCases(assignedToMeCaseParams(currentUser.username, { status: "in_review" })),
        api.listManualReviews({ status: "pending", limit: 50, offset: 0 }),
        api.listCaseSuggestions({ status: "pending", limit: 50, offset: 0 }),
      ]);

      return {
        summary,
        assignedCases: assignedCases.filter((item) => matchesSessionContext(item, currentUser)),
        underReviewCases: underReviewCases.filter((item) => matchesSessionContext(item, currentUser)),
        pendingReviews: pendingReviews.filter((item) => matchesSessionContext(item, currentUser)),
        pendingSuggestions: pendingSuggestions.filter((item) => matchesSessionContext(item, currentUser)),
      };
    },
    [currentUser.username, currentUser.organization_id, currentUser.site_id],
  );
  const returnTo = `${location.pathname}${location.search}`;

  return (
    <div>
      <PageHeader
        title="My Work"
        description="Personal operational queue for assigned cases, under-review cases and pending triage."
        actions={
          <>
            <Link className="btn" to={`/cases?ownership=mine&assigned_to=${encodeURIComponent(currentUser.username)}&limit=25&offset=0`}>
              My cases
            </Link>
            <button className="btn" type="button" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </>
        }
      />

      <DataState loading={loading} error={error} onRetry={refresh}>
        {data ? <MyWorkContent bundle={data} returnTo={returnTo} /> : null}
      </DataState>
    </div>
  );
}

function MyWorkContent({ bundle, returnTo }: { bundle: MyWorkBundle; returnTo: string }) {
  const { currentUser } = useCurrentUser();
  const hasWork =
    bundle.assignedCases.length > 0 ||
    bundle.underReviewCases.length > 0 ||
    bundle.pendingReviews.length > 0 ||
    bundle.pendingSuggestions.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <SessionSummaryCard />
        <section className="panel p-4">
          <h2 className="text-base font-semibold text-zinc-950">Quick actions</h2>
          <div className="mt-4 grid gap-2">
            <Link className="btn justify-between" to={`/cases?ownership=mine&assigned_to=${encodeURIComponent(currentUser.username)}&limit=25&offset=0`}>
              Assigned cases
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="btn justify-between" to="/manual-reviews?status=pending&limit=25&offset=0">
              Pending reviews
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="btn justify-between" to="/case-suggestions?status=pending&limit=25&offset=0">
              Pending suggestions
              <ArrowRight className="h-4 w-4" />
            </Link>
            <RoleAwareAction permission="bulk:write" showHint>
              {({ disabled, reason }) => (
                <Link
                  className={`btn justify-between ${disabled ? "pointer-events-none opacity-50" : ""}`}
                  to="/cases?ownership=unassigned&limit=25&offset=0"
                  aria-disabled={disabled}
                  title={reason ?? undefined}
                >
                  Bulk assignment queue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </RoleAwareAction>
          </div>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WorkQueueCard label="Assigned to me" value={bundle.assignedCases.length} to="/cases?ownership=mine&limit=25&offset=0" icon={FileText} tone="success" />
        <WorkQueueCard label="Under review" value={bundle.underReviewCases.length} to="/cases?ownership=mine&status=in_review&limit=25&offset=0" icon={Search} tone="attention" />
        <WorkQueueCard label="Pending reviews" value={bundle.pendingReviews.length} to="/manual-reviews?status=pending&limit=25&offset=0" icon={ClipboardList} tone="attention" />
        <WorkQueueCard label="Pending suggestions" value={bundle.pendingSuggestions.length} to="/case-suggestions?status=pending&limit=25&offset=0" icon={Search} tone="attention" />
      </div>

      {!hasWork ? <EmptyState label="No personal work items match the current session context." /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <WorkSection title="Assigned cases" count={bundle.assignedCases.length}>
          {bundle.assignedCases.slice(0, 8).map((item) => (
            <CaseWorkItem key={item.case_id} item={item} to={`/cases/${item.case_id}?returnTo=${encodeURIComponent(returnTo)}`} />
          ))}
        </WorkSection>
        <WorkSection title="Under review assigned to me" count={bundle.underReviewCases.length}>
          {bundle.underReviewCases.slice(0, 8).map((item) => (
            <CaseWorkItem key={item.case_id} item={item} to={`/cases/${item.case_id}?returnTo=${encodeURIComponent(returnTo)}`} />
          ))}
        </WorkSection>
        <WorkSection title="Pending manual reviews" count={bundle.pendingReviews.length}>
          {bundle.pendingReviews.slice(0, 8).map((item) => (
            <ReviewWorkItem
              key={item.review_id}
              item={item}
              to={`/manual-reviews?review_id=${encodeURIComponent(item.review_id)}&returnTo=${encodeURIComponent(returnTo)}`}
            />
          ))}
        </WorkSection>
        <WorkSection title="Pending case suggestions" count={bundle.pendingSuggestions.length}>
          {bundle.pendingSuggestions.slice(0, 8).map((item) => (
            <SuggestionWorkItem
              key={item.suggestion_id}
              item={item}
              to={`/case-suggestions?suggestion_id=${encodeURIComponent(item.suggestion_id)}&returnTo=${encodeURIComponent(returnTo)}`}
            />
          ))}
        </WorkSection>
      </div>
    </div>
  );
}

function WorkSection({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
        <span className="text-xs font-medium text-zinc-500">{count}</span>
      </div>
      <div className="space-y-3">{count === 0 ? <EmptyState label="Nothing pending in this queue." /> : children}</div>
    </section>
  );
}

function CaseWorkItem({ item, to }: { item: CaseRecord; to: string }) {
  return (
    <Link className="block rounded border border-zinc-200 bg-white p-3 hover:border-teal-200 hover:bg-teal-50/30" to={to}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-zinc-950">{item.title}</div>
          <div className="mt-1 text-xs text-zinc-500">{shortId(item.case_id)}</div>
        </div>
        <StatusBadge value={item.status} tone={statusTone(item.status)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge value={item.severity} tone={statusTone(item.severity)} />
        <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">Priority {item.priority}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-zinc-500">
        <span>Updated {formatDateTime(item.updated_at)}</span>
        <ContextChips organizationId={item.organization_id} siteId={item.site_id} compact />
      </div>
    </Link>
  );
}

function ReviewWorkItem({ item, to }: { item: ManualReview; to: string }) {
  return (
    <Link className="block rounded border border-zinc-200 bg-white p-3 hover:border-teal-200 hover:bg-teal-50/30" to={to}>
      <QueueItemHeader title={item.review_type} id={item.review_id} status={item.status} />
      <QueueItemMeta severity={item.severity} priority={item.priority} eventTs={item.event_ts} organizationId={item.organization_id} siteId={item.site_id} />
      <p className="mt-2 line-clamp-2 text-sm text-zinc-700">{item.reason_summary}</p>
    </Link>
  );
}

function SuggestionWorkItem({ item, to }: { item: CaseSuggestion; to: string }) {
  return (
    <Link className="block rounded border border-zinc-200 bg-white p-3 hover:border-teal-200 hover:bg-teal-50/30" to={to}>
      <QueueItemHeader title={item.suggestion_type} id={item.suggestion_id} status={item.status} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">Evidence {item.evidence_count}</span>
        <ContextChips organizationId={item.organization_id} siteId={item.site_id} compact />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-zinc-700">{item.reason_summary}</p>
    </Link>
  );
}

function QueueItemHeader({ title, id, status }: { title: string; id: string; status: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-zinc-950">{title}</div>
        <div className="mt-1 text-xs text-zinc-500">{shortId(id)}</div>
      </div>
      <StatusBadge value={status} tone={statusTone(status)} />
    </div>
  );
}

function QueueItemMeta({
  severity,
  priority,
  eventTs,
  organizationId,
  siteId,
}: {
  severity: string;
  priority: number;
  eventTs: string;
  organizationId: string | null;
  siteId: string | null;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <StatusBadge value={severity} tone={statusTone(severity)} />
      <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">Priority {priority}</span>
      <span className="text-xs text-zinc-500">{formatDateTime(eventTs)}</span>
      <ContextChips organizationId={organizationId} siteId={siteId} compact />
    </div>
  );
}
