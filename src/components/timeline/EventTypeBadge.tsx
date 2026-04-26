import { Cpu, Workflow } from "lucide-react";

import { StatusBadge, statusTone } from "../StatusBadge";

export type EventCategory = "operational" | "technical";

export function eventCategory(eventType: string): EventCategory {
  if (
    eventType.startsWith("case_") ||
    eventType.startsWith("manual_review") ||
    eventType.startsWith("case_suggestion") ||
    eventType.includes("assignment") ||
    eventType.includes("lifecycle")
  ) {
    return "operational";
  }
  return "technical";
}

export function EventTypeBadge({ eventType }: { eventType: string }) {
  const category = eventCategory(eventType);
  const Icon = category === "operational" ? Workflow : Cpu;

  return (
    <span className="inline-flex max-w-full items-center gap-1.5">
      <StatusBadge value={eventType} tone={statusTone(eventType)} />
      <span
        className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium ${
          category === "operational"
            ? "border-teal-200 bg-teal-50 text-teal-800"
            : "border-sky-200 bg-sky-50 text-sky-800"
        }`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {category}
      </span>
    </span>
  );
}
