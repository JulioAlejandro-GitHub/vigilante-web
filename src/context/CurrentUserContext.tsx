import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface CurrentUser {
  username: string;
  displayName: string;
}

interface CurrentUserContextValue {
  currentUser: CurrentUser;
  setCurrentUserName: (username: string) => void;
}

const STORAGE_KEY = "vigilante.currentUser";
const defaultUsername = import.meta.env.VITE_DEFAULT_USER || "julio";

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

function buildUser(username: string): CurrentUser {
  const normalized = username.trim() || defaultUsername;
  return {
    username: normalized,
    displayName: normalized,
  };
}

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState(() => {
    if (typeof window === "undefined") {
      return defaultUsername;
    }
    return window.localStorage.getItem(STORAGE_KEY) || defaultUsername;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, username);
  }, [username]);

  const value = useMemo<CurrentUserContextValue>(
    () => ({
      currentUser: buildUser(username),
      setCurrentUserName: (nextUsername) => setUsername(nextUsername.trim() || defaultUsername),
    }),
    [username],
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
