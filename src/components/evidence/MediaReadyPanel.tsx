import { MediaPlaceholderPanel } from "./MediaPlaceholderPanel";

interface MediaReadyPanelProps {
  sourceEventId?: string | null;
}

export function MediaReadyPanel({ sourceEventId }: MediaReadyPanelProps) {
  return (
    <section className="panel p-4">
      <h2 className="text-base font-semibold text-zinc-950">Media-ready evidence</h2>
      <p className="mt-1 text-sm text-zinc-600">Reserved layout for future image or video evidence tied to the technical payload.</p>
      <div className="mt-4">
        <MediaPlaceholderPanel sourceEventId={sourceEventId} />
      </div>
    </section>
  );
}
