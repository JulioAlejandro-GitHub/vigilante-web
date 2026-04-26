import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type {
  CurrentUser,
  MockSession,
  Permission,
  PermissionResourceContext,
  PermissionResult,
  SessionIdentity,
  SessionOperationalContext,
  UserRole,
} from "../types/session";
import { checkPermission } from "../utils/permissions";

export type {
  CurrentUser,
  MockSession,
  Permission,
  PermissionResourceContext,
  PermissionResult,
  SessionIdentity,
  SessionOperationalContext,
  UserRole,
} from "../types/session";

interface CurrentUserContextValue {
  currentUser: CurrentUser;
  session: MockSession;
  availableUsers: CurrentUser[];
  availableIdentities: SessionIdentity[];
  availableRoles: UserRole[];
  setCurrentUserName: (username: string) => void;
  setRole: (role: UserRole) => void;
  updateSessionContext: (patch: Partial<SessionOperationalContext>) => void;
  resetSessionContext: () => void;
  updateCurrentUser: (patch: Partial<CurrentUser>) => void;
  can: (permission: Permission, resourceContext?: PermissionResourceContext) => boolean;
  check: (permission: Permission, resourceContext?: PermissionResourceContext) => PermissionResult;
}

const STORAGE_KEY = "vigilante.session.v1";
const LEGACY_STORAGE_KEY = "vigilante.currentUser";
const defaultUsername = import.meta.env.VITE_DEFAULT_USER || "julio";
const defaultOrganizationId = import.meta.env.VITE_DEFAULT_ORGANIZATION_ID || null;
const defaultSiteId = import.meta.env.VITE_DEFAULT_SITE_ID || null;

const mockIdentities: SessionIdentity[] = [
  {
    username: "julio",
    name: "Julio Analyst",
    default_role: "analyst",
    default_organization_id: defaultOrganizationId,
    default_site_id: defaultSiteId,
  },
  {
    username: "ana",
    name: "Ana Supervisor",
    default_role: "supervisor",
    default_organization_id: defaultOrganizationId,
    default_site_id: defaultSiteId,
  },
  {
    username: "camila",
    name: "Camila Analyst",
    default_role: "analyst",
    default_organization_id: defaultOrganizationId,
    default_site_id: defaultSiteId,
  },
];

const availableRoles: UserRole[] = ["analyst", "supervisor"];
const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

function findMockIdentity(username: string) {
  return mockIdentities.find((user) => user.username === username);
}

function buildIdentity(username: string, patch: Partial<SessionIdentity> = {}): SessionIdentity {
  const normalized = username.trim() || defaultUsername;
  const base = findMockIdentity(normalized);

  return {
    username: normalized,
    name: patch.name ?? base?.name ?? normalized,
    default_role: patch.default_role ?? base?.default_role ?? "analyst",
    default_organization_id: patch.default_organization_id ?? base?.default_organization_id ?? defaultOrganizationId,
    default_site_id: patch.default_site_id ?? base?.default_site_id ?? defaultSiteId,
  };
}

function defaultContext(identity: SessionIdentity): SessionOperationalContext {
  return {
    organization_id: identity.default_organization_id,
    site_id: identity.default_site_id,
  };
}

function buildSession(
  username = defaultUsername,
  patch: {
    identity?: Partial<SessionIdentity>;
    role?: UserRole;
    context?: Partial<SessionOperationalContext>;
  } = {},
): MockSession {
  const identity = buildIdentity(patch.identity?.username ?? username, patch.identity);
  const contextDefaults = defaultContext(identity);

  return {
    identity,
    role: patch.role ?? identity.default_role,
    context: {
      organization_id: patch.context?.organization_id ?? contextDefaults.organization_id,
      site_id: patch.context?.site_id ?? contextDefaults.site_id,
    },
  };
}

function toCurrentUser(session: MockSession): CurrentUser {
  return {
    username: session.identity.username,
    name: session.identity.name,
    role: session.role,
    organization_id: session.context.organization_id,
    site_id: session.context.site_id,
  };
}

function normalizeSession(value: unknown): MockSession {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const identityRecord =
    typeof record.identity === "object" && record.identity !== null ? (record.identity as Partial<SessionIdentity>) : undefined;
  const contextRecord =
    typeof record.context === "object" && record.context !== null ? (record.context as Partial<SessionOperationalContext>) : undefined;

  const legacyUsername = typeof record.username === "string" ? record.username : defaultUsername;
  const role = record.role === "supervisor" || record.role === "analyst" ? record.role : undefined;
  const organization_id =
    typeof record.organization_id === "string" || record.organization_id === null ? record.organization_id : undefined;
  const site_id = typeof record.site_id === "string" || record.site_id === null ? record.site_id : undefined;

  return buildSession(identityRecord?.username ?? legacyUsername, {
    identity: {
      ...identityRecord,
      name: typeof record.name === "string" ? record.name : identityRecord?.name,
    },
    role,
    context: {
      ...contextRecord,
      organization_id: contextRecord?.organization_id ?? organization_id,
      site_id: contextRecord?.site_id ?? site_id,
    },
  });
}

function readStoredSession(): MockSession {
  if (typeof window === "undefined") {
    return buildSession();
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return normalizeSession(JSON.parse(stored));
    } catch {
      return buildSession();
    }
  }

  const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    try {
      return normalizeSession(JSON.parse(legacy));
    } catch {
      return buildSession(legacy);
    }
  }

  return buildSession();
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MockSession>(() => readStoredSession());

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, [session]);

  const currentUser = useMemo(() => toCurrentUser(session), [session]);
  const availableUsers = useMemo(() => mockIdentities.map((identity) => toCurrentUser(buildSession(identity.username))), []);

  const value = useMemo<CurrentUserContextValue>(
    () => ({
      currentUser,
      session,
      availableUsers,
      availableIdentities: mockIdentities,
      availableRoles,
      setCurrentUserName: (nextUsername) =>
        setSession((current) => ({
          ...current,
          identity: buildIdentity(nextUsername.trim() || defaultUsername),
        })),
      setRole: (role) => setSession((current) => ({ ...current, role })),
      updateSessionContext: (patch) =>
        setSession((current) => ({
          ...current,
          context: {
            organization_id: patch.organization_id !== undefined ? patch.organization_id : current.context.organization_id,
            site_id: patch.site_id !== undefined ? patch.site_id : current.context.site_id,
          },
        })),
      resetSessionContext: () => setSession((current) => ({ ...current, context: defaultContext(current.identity) })),
      updateCurrentUser: (patch) =>
        setSession((current) => {
          const identity = patch.username || patch.name ? buildIdentity(patch.username ?? current.identity.username, { name: patch.name }) : current.identity;
          return {
            identity,
            role: patch.role ?? current.role,
            context: {
              organization_id:
                patch.organization_id !== undefined ? patch.organization_id : current.context.organization_id,
              site_id: patch.site_id !== undefined ? patch.site_id : current.context.site_id,
            },
          };
        }),
      can: (permission, resourceContext) => checkPermission(session.role, permission, session.context, resourceContext).allowed,
      check: (permission, resourceContext) => checkPermission(session.role, permission, session.context, resourceContext),
    }),
    [availableUsers, currentUser, session],
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
