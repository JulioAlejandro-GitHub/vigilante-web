import { Activity, Camera, ClipboardList, FileText, LayoutDashboard, ListChecks, Search, ShieldCheck, TowerControl } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { CurrentUserMenu } from "../session/CurrentUserMenu";
import type { Permission } from "../../types/session";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/control-center", label: "Centro de Control", icon: TowerControl, permission: "control-center:view" as Permission },
  { to: "/my-work", label: "My Work", icon: ListChecks },
  { to: "/cases", label: "Cases", icon: FileText },
  { to: "/manual-reviews", label: "Manual reviews", icon: ClipboardList },
  { to: "/camera-recommendations", label: "Camera recommendations", icon: Camera },
  { to: "/case-suggestions", label: "Suggestions", icon: Search },
  { to: "/timeline", label: "Timeline", icon: Activity },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { can } = useAuth();
  const visibleItems = navItems.filter((item) => !item.permission || can(item.permission));

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex min-h-16 items-center gap-3 border-b border-zinc-200 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-teal-700 text-white">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-950">vigilante-web</div>
          <div className="truncate text-xs text-zinc-500">Analyst operations</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium ${
                isActive ? "bg-teal-50 text-teal-900 ring-1 ring-teal-100" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-zinc-200 p-4 text-xs text-zinc-500">
        <div className="mb-3 lg:hidden">
          <CurrentUserMenu compact />
        </div>
        <div className="font-medium text-zinc-700">API</div>
        <div className="mt-1 truncate">{import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}</div>
      </div>
    </div>
  );
}
