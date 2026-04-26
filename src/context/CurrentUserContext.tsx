import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type UserRole = "analyst" | "supervisor";

export interface CurrentUser {
  username: string;
  name: string;
  role: UserRole;
  organization_id: string | null;
  site_id: string | null;
}

interface CurrentUserContextValue {
  currentUser: CurrentUser;
  availableUsers: CurrentUser[];
  setCurrentUserName: (username: string) => void;
  updateCurrentUser: (patch: Partial<CurrentUser>) => void;
  can: (permission: Permission) => boolean;
}

export type Permission = "case:write" | "queue:resolve" | "suggestion:promote" | "bulk:write" | "supervisor:view";

const STORAGE_KEY = "vigilante.currentUser";
const defaultUsername = import.meta.env.VITE_DEFAULT_USER || "julio";

const mockUsers: CurrentUser[] = [
  {
    username: "julio",
    name: "Julio Analyst",
    role: "analyst",
    organization_id: import.meta.env.VITE_DEFAULT_ORGANIZATION_ID || null,
    site_id: import.meta.env.VITE_DEFAULT_SITE_ID || null,
  },
  {
    username: "ana",
    name: "Ana Supervisor",
    role: "supervisor",
    organization_id: import.meta.env.VITE_DEFAULT_ORGANIZATION_ID || null,
    site_id: import.meta.env.VITE_DEFAULT_SITE_ID || null,
  },
  {
    username: "camila",
    name: "Camila Analyst",
    role: "analyst",
    organization_id: import.meta.env.VITE_DEFAULT_ORGANIZATION_ID || null,
    site_id: import.meta.env.VITE_DEFAULT_SITE_ID || null,
  },
];

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

function findMockUser(username: string) {
  return mockUsers.find((user) => user.username === username);
}

function buildUser(username: string, patch: Partial<CurrentUser> = {}): CurrentUser {
  const normalized = username.trim() || defaultUsername;
  const base = findMockUser(normalized);
  return {
    username: normalized,
    name: patch.name ?? base?.name ?? normalized,
    role: patch.role ?? base?.role ?? "analyst",
    organization_id: patch.organization_id ?? base?.organization_id ?? null,
    site_id: patch.site_id ?? base?.site_id ?? null,
  };
}

function readStoredUser(): CurrentUser {
  if (typeof window === "undefined") {
    return buildUser(defaultUsername);
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return buildUser(defaultUsername);
  }

  try {
    const parsed = JSON.parse(stored) as Partial<CurrentUser>;
    return buildUser(parsed.username ?? defaultUsername, parsed);
  } catch {
    return buildUser(stored);
  }
}

function canRole(role: UserRole, permission: Permission) {
  if (role === "supervisor") {
    return true;
  }
  return ["case:write", "queue:resolve", "suggestion:promote", "bulk:write"].includes(permission);
}

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() => readStoredUser());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
  }, [currentUser]);

  const value = useMemo<CurrentUserContextValue>(
    () => ({
      currentUser,
      availableUsers: mockUsers,
      setCurrentUserName: (nextUsername) => setCurrentUser(buildUser(nextUsername.trim() || defaultUsername)),
      updateCurrentUser: (patch) => setCurrentUser((user) => ({ ...user, ...patch, username: patch.username?.trim() || user.username })),
      can: (permission) => canRole(currentUser.role, permission),
    }),
    [currentUser],
  );

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used inside CurrentUserProvider");
  }
  return context;
}
