import type { ReactNode } from "react";

export type CaseTabId = "overview" | "timeline" | "notes" | "reviews" | "suggestions" | "evidence";

export interface CaseTab {
  id: CaseTabId;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface CaseTabsProps {
  tabs: CaseTab[];
  activeTab: CaseTabId;
  onChange: (tab: CaseTabId) => void;
}

export function CaseTabs({ tabs, activeTab, onChange }: CaseTabsProps) {
  return (
    <div className="sticky top-16 z-10 -mx-4 border-y border-zinc-200 bg-zinc-50/95 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:rounded sm:border sm:bg-white">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`inline-flex shrink-0 items-center gap-2 rounded border px-3 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? "border-teal-700 bg-teal-700 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
            type="button"
            onClick={() => onChange(tab.id)}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined ? (
              <span className={`rounded px-1.5 py-0.5 text-xs ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
