import { useEffect, useMemo, useState } from "react";

import { ActiveCasePanel } from "./components/ActiveCasePanel";
import { LiveCameraGrid } from "./components/LiveCameraGrid";
import { LiveEventTimeline } from "./components/LiveEventTimeline";
import { OperationalHeader } from "./components/OperationalHeader";
import { useCameraLiveTiles } from "./hooks/useCameraLiveTiles";
import { useCameraStreams } from "./hooks/useCameraStreams";
import { useControlCenterCases } from "./hooks/useControlCenterCases";
import { useControlCenterEvents } from "./hooks/useControlCenterEvents";
import { useLiveCameraFrames } from "./hooks/useLiveCameraFrames";
import { useOperationalSummary } from "./hooks/useOperationalSummary";
import type { ControlCenterEventGroup } from "./types/controlCenter.types";
import { useCurrentUser } from "../../hooks/useCurrentUser";

export function ControlCenterPage() {
  const { currentUser, can } = useCurrentUser();
  const canView = can("control-center:view");
  const filters = useMemo(
    () => ({
      organization_id: currentUser.organization_id ?? undefined,
      site_id: currentUser.site_id ?? undefined,
    }),
    [currentUser.organization_id, currentUser.site_id],
  );
  const overview = useOperationalSummary({ enabled: canView, assignedTo: currentUser.username });
  const eventState = useControlCenterEvents({ enabled: canView, filters });
  const cameraState = useCameraStreams(eventState.events, { enabled: canView });
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const selectedGroup = selectedGroupId ? eventState.groups.find((group) => group.id === selectedGroupId) ?? null : null;
  const selectedCameraId = selectedGroup?.event.camera_id ?? cameraState.tiles[0]?.camera.camera_id ?? null;
  const liveFrameState = useLiveCameraFrames(cameraState.cameras, {
    enabled: canView && !cameraState.loading,
    selectedCameraId,
  });
  const liveTiles = useCameraLiveTiles(cameraState.tiles, liveFrameState.framesByCameraId);
  const caseBundle = useControlCenterCases({
    caseId: canView ? selectedGroup?.event.case_id ?? null : null,
    sourceEventId: canView ? selectedGroup?.event.source_event_id ?? null : null,
  });

  useEffect(() => {
    if (!eventState.groups.length) {
      setSelectedGroupId(null);
      return;
    }
    if (!selectedGroupId || !eventState.groups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(eventState.groups[0].id);
    }
  }, [eventState.groups, selectedGroupId]);

  function refreshAll() {
    overview.refresh();
    eventState.refresh();
    cameraState.refresh();
    liveFrameState.refresh();
    caseBundle.refresh();
  }

  if (!canView) {
    return (
      <div className="panel p-6">
        <h1 className="text-xl font-semibold text-zinc-950">Centro de Control</h1>
        <p className="mt-2 text-sm text-zinc-600">Usuario sin permisos para ver eventos, cámaras y evidencia sensible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <OperationalHeader
        overview={overview}
        cameras={liveTiles}
        events={eventState.groups}
        currentUser={currentUser}
        lastUpdatedAt={liveFrameState.lastUpdatedAt ?? eventState.lastUpdatedAt}
        onRefresh={refreshAll}
        refreshing={eventState.refreshing || cameraState.refreshing || liveFrameState.refreshing || overview.loading || caseBundle.refreshing}
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_430px] 2xl:grid-cols-[minmax(0,1fr)_470px]">
        <div className="min-w-0 space-y-3">
          <LiveCameraGrid
            cameras={liveTiles}
            selectedCameraId={liveFrameState.activeCameraId}
            loading={cameraState.loading}
            error={cameraState.error}
            onRetry={refreshAll}
            canLoadMore={cameraState.hasMore}
            loadingMore={cameraState.loadingMore}
            onLoadMore={cameraState.loadMore}
            liveBudget={liveFrameState.budget}
          />

          <ActiveCasePanel selectedGroup={selectedGroup} caseBundle={caseBundle} onChanged={refreshAll} />
        </div>

        <div className="min-w-0 xl:sticky xl:top-16 xl:self-start">
          <LiveEventTimeline
            events={eventState.groups}
            selectedId={selectedGroup?.id ?? null}
            loading={eventState.loading}
            error={eventState.error}
            refreshing={eventState.refreshing}
            onRetry={eventState.refresh}
            onSelect={(group: ControlCenterEventGroup) => setSelectedGroupId(group.id)}
            canLoadMore={eventState.hasMore}
            loadingMore={eventState.loadingMore}
            onLoadMore={eventState.loadMore}
          />
        </div>
      </div>
    </div>
  );
}
