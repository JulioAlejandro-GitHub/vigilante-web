import { useEffect, useMemo, useState } from "react";

import { CameraGrid } from "./components/CameraGrid";
import { CaseDetailPanel } from "./components/CaseDetailPanel";
import { ControlCenterHeader } from "./components/ControlCenterHeader";
import { EventTimeline } from "./components/EventTimeline";
import { useCameraStreams } from "./hooks/useCameraStreams";
import { useControlCenterCases } from "./hooks/useControlCenterCases";
import { useControlCenterEvents } from "./hooks/useControlCenterEvents";
import { useControlCenterOverview } from "./hooks/useControlCenterOverview";
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
  const overview = useControlCenterOverview({ enabled: canView, assignedTo: currentUser.username });
  const eventState = useControlCenterEvents({ enabled: canView, filters });
  const cameraState = useCameraStreams(eventState.events, { enabled: canView });
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const selectedGroup = selectedGroupId ? eventState.groups.find((group) => group.id === selectedGroupId) ?? null : null;
  const caseBundle = useControlCenterCases({
    caseId: canView ? selectedGroup?.event.case_id ?? null : null,
    sourceEventId: canView ? selectedGroup?.event.source_event_id ?? null : null,
  });

  useEffect(() => {
    if (!eventState.groups.length || !selectedGroupId) {
      setSelectedGroupId(null);
      return;
    }
    if (!eventState.groups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(null);
    }
  }, [eventState.groups, selectedGroupId]);

  function refreshAll() {
    overview.refresh();
    eventState.refresh();
    cameraState.refresh();
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
    <div className="space-y-4">
      <ControlCenterHeader
        overview={overview}
        cameras={cameraState.tiles}
        events={eventState.groups}
        onRefresh={refreshAll}
        refreshing={eventState.refreshing || cameraState.refreshing || overview.loading || caseBundle.refreshing}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_460px] 2xl:grid-cols-[minmax(0,1fr)_500px]">
        <div className="min-w-0 space-y-4">
          <CameraGrid
            cameras={cameraState.tiles}
            selectedCameraId={selectedGroup?.event.camera_id ?? null}
            loading={cameraState.loading}
            error={cameraState.error}
            onRetry={cameraState.refresh}
            canLoadMore={cameraState.hasMore}
            loadingMore={cameraState.loadingMore}
            onLoadMore={cameraState.loadMore}
          />
          <EventTimeline
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

        <CaseDetailPanel selectedGroup={selectedGroup} caseBundle={caseBundle} onChanged={refreshAll} />
      </div>
    </div>
  );
}
