import { useState } from "react";

import { controlCenterApi } from "../services/controlCenterApi";
import type { OperatorActionDefinition } from "../types/controlCenter.types";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import type { PermissionResourceContext } from "../../../types/session";
import { asErrorMessage } from "../../../utils/format";

interface UseOperatorActionsOptions {
  caseId: string | null;
  resourceContext?: PermissionResourceContext;
  onChanged: () => void;
}

export function useOperatorActions({ caseId, resourceContext, onChanged }: UseOperatorActionsOptions) {
  const { currentUser, can } = useCurrentUser();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const actions: OperatorActionDefinition[] = [
    {
      key: "flag_suspicious",
      label: "Marcar sospechoso",
      tone: "primary",
      permission: "case:status",
      critical: true,
    },
    {
      key: "resolve_benign",
      label: "Resolver benigno",
      tone: "default",
      permission: "case:status",
      critical: true,
    },
    {
      key: "close_case",
      label: "Cerrar caso",
      tone: "danger",
      permission: "case:close",
      critical: true,
    },
    {
      key: "reopen_case",
      label: "Reabrir caso",
      tone: "default",
      permission: "case:close",
      critical: true,
    },
    {
      key: "link_profile",
      label: "Vincular perfil",
      tone: "default",
      permission: null,
      critical: true,
      disabledReason: "No existe endpoint seguro para vincular perfiles desde esta API.",
    },
    {
      key: "merge_case",
      label: "Merge caso",
      tone: "default",
      permission: null,
      critical: true,
      disabledReason: "No existe endpoint de merge con caso destino en la API actual.",
    },
  ];

  async function run(action: OperatorActionDefinition, reason: string) {
    if (!caseId || busy) {
      return;
    }
    if (action.disabledReason) {
      setError(action.disabledReason);
      return;
    }
    if (action.permission && !can(action.permission, resourceContext)) {
      setError("La sesión autenticada no tiene permisos para ejecutar esta acción.");
      return;
    }

    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      setError("La razón operativa es obligatoria.");
      return;
    }

    setBusy(action.key);
    setError(null);
    setSuccess(null);
    try {
      if (action.key === "flag_suspicious") {
        await controlCenterApi.changeCaseStatus(caseId, {
          status: "in_review",
          reason: normalizedReason,
          changed_by: currentUser.username,
        });
      } else if (action.key === "resolve_benign") {
        await controlCenterApi.changeCaseStatus(caseId, {
          status: "dismissed",
          reason: normalizedReason,
          changed_by: currentUser.username,
        });
      } else if (action.key === "close_case") {
        await controlCenterApi.closeCase(caseId, { reason: normalizedReason, changed_by: currentUser.username });
      } else if (action.key === "reopen_case") {
        await controlCenterApi.reopenCase(caseId, { reason: normalizedReason, changed_by: currentUser.username });
      }
      setSuccess(`${action.label} completado.`);
      onChanged();
    } catch (caught) {
      setError(asErrorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  return {
    actions,
    busy,
    error,
    success,
    run,
    clearFeedback: () => {
      setError(null);
      setSuccess(null);
    },
  };
}
