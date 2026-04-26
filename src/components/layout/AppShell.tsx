import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "../navigation/Sidebar";
import { CurrentUserMenu } from "../session/CurrentUserMenu";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-zinc-200">
        <Sidebar />
      </div>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <button className="btn lg:hidden" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-950">Operations workspace</div>
              <div className="truncate text-xs text-zinc-500">Cases, queues and audit timeline</div>
            </div>
            <div className="hidden sm:block">
              <CurrentUserMenu />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-zinc-950/35" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-[min(320px,85vw)] border-r border-zinc-200 bg-white shadow-xl">
            <button
              className="btn absolute right-3 top-3 z-10 px-2"
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
