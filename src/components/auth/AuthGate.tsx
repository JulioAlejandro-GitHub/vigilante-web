import { ShieldCheck } from "lucide-react";

interface AuthGateProps {
  message?: string;
}

export function AuthGate({ message = "Checking session" }: AuthGateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="panel flex w-full max-w-sm items-center gap-3 p-4 text-sm text-zinc-700">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-teal-700 text-white">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <div className="font-semibold text-zinc-950">{message}</div>
          <div className="mt-1 text-xs text-zinc-500">vigilante-web</div>
        </div>
      </div>
    </div>
  );
}
