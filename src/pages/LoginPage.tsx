import { FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import { ApiError } from "../api/client";
import { Feedback } from "../components/Feedback";
import { FormField } from "../components/forms/FormField";
import { useAuth } from "../hooks/useAuth";

interface LoginLocationState {
  from?: {
    pathname?: string;
    search?: string;
  };
}

function loginErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return "Invalid username or password.";
  }
  if (error instanceof ApiError && error.status === 403) {
    return error.message;
  }
  return error instanceof Error ? error.message : "Unable to sign in.";
}

export function LoginPage() {
  const { currentUser, loading, login, authError } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LoginLocationState | null;
  const returnTo = `${state?.from?.pathname ?? "/dashboard"}${state?.from?.search ?? ""}`;

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  if (currentUser) {
    return <Navigate to={returnTo} replace />;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await login(username.trim(), password);
      navigate(returnTo, { replace: true });
    } catch (caught) {
      setError(loginErrorMessage(caught));
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <section className="panel w-full max-w-md p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded bg-teal-700 text-white">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-950">Sign in to vigilante-web</h1>
            <p className="mt-1 text-sm text-zinc-500">Use your vigilante-api account.</p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Feedback error={error} success={null} />
          <FormField label="Username or email">
            <input
              autoComplete="username"
              autoFocus
              className="field"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="username or email"
            />
          </FormField>
          <FormField label="Password">
            <input
              autoComplete="current-password"
              className="field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
            />
          </FormField>
          <button className="btn btn-primary w-full" type="submit" disabled={loading || !username.trim() || !password}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
