import { Columns2 } from "lucide-react";

interface EvidenceCompareToggleProps {
  enabled: boolean;
  disabled?: boolean;
  compareLabel?: string;
  onToggle: () => void;
}

export function EvidenceCompareToggle({ enabled, disabled = false, compareLabel = "next image", onToggle }: EvidenceCompareToggleProps) {
  return (
    <button
      className={`btn px-2 py-1 text-xs ${enabled ? "border-teal-700 bg-teal-700 text-white hover:bg-teal-800" : ""}`}
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={enabled}
      title={disabled ? "Comparison needs at least two images" : `Compare with ${compareLabel}`}
    >
      <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
      Compare
    </button>
  );
}
