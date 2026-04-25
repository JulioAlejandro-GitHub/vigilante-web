import { Activity, ClipboardList, FileText, LayoutDashboard, Menu, Search, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cases", label: "Cases", icon: FileText },
  { to: "/manual-reviews", label: "Manual reviews", icon: ClipboardList },
  { to: "/case-suggestions", label: "Suggestions", icon: Search },
  { to: "/timeline", label: "Timeline", icon: Activity },
];

export function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
        <div className="flex min-h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-teal-700 text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-950">vigilante-web</div>
              <div className="text-xs text-zinc-500">Analyst operations</div>
            </div>
          </div>
          <button className="btn sm:hidden" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        <nav className={`${open ? "block" : "hidden"} border-t border-zinc-200 px-4 py-2 sm:block sm:border-t-0 sm:px-6`}>
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-medium ${
                    isActive ? "bg-teal-700 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                  }`
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
