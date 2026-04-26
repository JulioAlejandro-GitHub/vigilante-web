import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { authApi, normalizeCurrentUser } from "../api/authApi";
import { ApiError, onApiAuthFailure } from "../api/client";
import type {
  AuthSession,
  CurrentUser,
  Permission,
  PermissionResourceContext,
  PermissionResult,
  SessionIdentity,
  SessionOperationalContext,
  UserRole,
} from "../types/session";
import { checkPermission } from "../utils/permissions";
import { clearStoredToken, readStoredToken, writeStoredToken } from "../utils/tokenStorage";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  token: string | null;
  currentUser: CurrentUser | null;
  session: AuthSession | null;
  status: AuthStatus;
  loading: boolean;
  authError: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearSession: (reason?: string | null) => void;
  reloadCurrentUser: () => Promise<void>;
  can: (permission: Permission, resourceContext?: PermissionResourceContext) => boolean;
  check: (permission: Permission, resourceContext?: PermissionResourceContext) => PermissionResult;
  availableUsers: CurrentUser[];
  availableIdentities: SessionIdentity[];
  availableRoles: UserRole[];
  setCurrentUserName: (username: string) => void;
  setRole: (role: UserRole) => void;
  updateSessionContext: (patch: Partial<SessionOperationalContext>) => void;
  resetSessionContext: () => void;
  updateCurrentUser: (patch: Partial<CurrentUser>) => void;
}

interface AuthProviderProps {
  children: ReactNode;
  initialToken?: string | null;
  initialUser?: CurrentUser | null;
  initialExpiresAt?: string | null;
  skipBootstrap?: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function sessionContextFor(user: CurrentUser): SessionOperationalContext {
  return {
    organization_id: user.organization_id,
    site_id: user.site_id,
    organization_ids: user.organization_ids,
    site_ids: user.site_ids,
  };
}

function buildSession(token: string, user: CurrentUser, expiresAt: string | null): AuthSession {
  return {
    accessToken: token,
    expiresAt,
    user,
    role: user.role,
    roles: user.roles,
    context: sessionContextFor(user),
  };
}

function authErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return "Your session expired or is no longer valid. Sign in again.";
  }
  if (error instanceof ApiError && error.status === 403) {
    return error.message;
  }
  return error instanceof Error ? error.message : "Unexpected authentication error.";
}

export function AuthProvider({
  children,
  initialToken,
  initialUser = null,
  initialExpiresAt = null,
  skipBootstrap = false,
}: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => initialToken ?? readStoredToken());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(initialUser);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt);
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (initialUser && (initialToken || skipBootstrap)) {
      return "authenticated";
    }
    return initialToken ?? readStoredToken() ? "loading" : "unauthenticated";
  });
  const [authError, setAuthError] = useState<string | null>(null);

  const clearSession = useCallback((reason: string | null = null) => {
    clearStoredToken();
    setToken(null);
    setCurrentUser(null);
    setExpiresAt(null);
    setStatus("unauthenticated");
    setAuthError(reason);
  }, []);

  const loadMe = useCallback(async () => {
    const me = normalizeCurrentUser(await authApi.me());
    setCurrentUser(me);
    setStatus("authenticated");
    setAuthError(null);
  }, []);

  useEffect(() => {
    if (skipBootstrap) {
      return;
    }

    let active = true;
    const storedToken = token ?? readStoredToken();
    if (!storedToken) {
      clearSession(null);
      return;
    }

    setStatus("loading");
    authApi
      .me()
      .then((me) => {
        if (!active) {
          return;
        }
        const normalized = normalizeCurrentUser(me);
        setToken(storedToken);
        setCurrentUser(normalized);
        setStatus("authenticated");
        setAuthError(null);
      })
      .catch((error: unknown) => {
        if (active) {
          clearSession(authErrorMessage(error));
        }
      });

    return () => {
      active = false;
    };
  }, [clearSession, skipBootstrap, token]);

  useEffect(() => {
    return onApiAuthFailure((error) => {
      clearSession(authErrorMessage(error));
    });
  }, [clearSession]);

  const login = useCallback(
    async (username: string, password: string) => {
      setStatus("loading");
      setAuthError(null);
      try {
        const response = await authApi.login({ username, password });
        writeStoredToken(response.access_token);
        setToken(response.access_token);
        setExpiresAt(response.expires_at);
        const me = normalizeCurrentUser(await authApi.me());
        setCurrentUser(me);
        setStatus("authenticated");
      } catch (error) {
        clearStoredToken();
        setToken(null);
        setCurrentUser(null);
        setExpiresAt(null);
        setStatus("unauthenticated");
        setAuthError(error instanceof ApiError && error.status === 401 ? "Invalid username or password." : authErrorMessage(error));
        throw error;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      if (readStoredToken()) {
        await authApi.logout();
      }
    } catch {
      // Logout is client-authoritative for this stateless JWT slice.
    } finally {
      clearSession(null);
    }
  }, [clearSession]);

  const session = useMemo(() => (token && currentUser ? buildSession(token, currentUser, expiresAt) : null), [currentUser, expiresAt, token]);

  const check = useCallback(
    (permission: Permission, resourceContext?: PermissionResourceContext) => {
      if (!currentUser) {
        return { allowed: false, reason: "Sign in to use this action." };
      }
      return checkPermission(currentUser.role, permission, sessionContextFor(currentUser), resourceContext, currentUser.roles);
    },
    [currentUser],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      currentUser,
      session,
      status,
      loading: status === "loading",
      authError,
      login,
      logout,
      clearSession,
      reloadCurrentUser: loadMe,
      can: (permission, resourceContext) => check(permission, resourceContext).allowed,
      check,
      availableUsers: currentUser ? [currentUser] : [],
      availableIdentities: currentUser
        ? [
            {
              username: currentUser.username,
              name: currentUser.name,
              default_role: currentUser.role,
              default_organization_id: currentUser.organization_id,
              default_site_id: currentUser.site_id,
            },
          ]
        : [],
      availableRoles: currentUser?.roles.length ? currentUser.roles : currentUser ? [currentUser.role] : [],
      setCurrentUserName: () => undefined,
      setRole: () => undefined,
      updateSessionContext: () => undefined,
      resetSessionContext: () => undefined,
      updateCurrentUser: () => undefined,
    }),
    [authError, check, clearSession, currentUser, loadMe, login, logout, session, status, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

export function useCurrentUser() {
  const context = useAuth();
  if (!context.currentUser || !context.session) {
    throw new Error("useCurrentUser must be used with an authenticated session");
  }
  return {
    ...context,
    currentUser: context.currentUser,
    session: context.session,
  };
}
