import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface ContextualBackLinkProps {
  to: string;
  label?: string;
}

export function ContextualBackLink({ to, label = "Back to context" }: ContextualBackLinkProps) {
  return (
    <Link className="btn" to={to}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
