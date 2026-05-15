# Vigilante Control Center

Modulo visual aislado en `src/features/control-center`.

## Endpoints usados

- `GET /health`: estado de servidor mostrado en el header.
- `GET /api/v1/dashboard/summary`: metricas operativas del header.
- `GET /api/v1/cameras?limit=6&offset=...`: camaras autorizadas, paginadas por el mosaico visible. La respuesta ya viene sanitizada por `vigilante-api`.
- `GET /api/v1/timeline?limit=20&offset=...&include_evidence=false`: eventos procesados recientes, ordenados descendente y agrupados por `case_id` en UI. El listado no resuelve media.
- `GET /api/v1/cases/{case_id}?expand=summary&include_evidence=false`: resumen barato del caso seleccionado.
- `GET /api/v1/cases/{case_id}/timeline?limit=6&offset=...&include_evidence=false`: cronologia paginada del caso seleccionado.
- `GET /api/v1/cases/{case_id}/evidence?limit=6&offset=...&source_event_id=...`: evidencia visual paginada y resuelta solo para el reel visible.
- `POST /api/v1/cases/{case_id}/status`: marcar sospechoso y resolver benigno.
- `POST /api/v1/cases/{case_id}/close` y `/reopen`: cierre y reapertura.

## SQL nuevo

No se agrego SQL ni migraciones. El modulo reutiliza tablas y proyecciones actuales: camaras, timeline, case_record, reviews, suggestions y evidencia resuelta por el media service.

## Evidencia visual

La evidencia ya no se resuelve desde el listado inicial. El reel pide paginas de 6 items al endpoint de evidencia del caso o del evento seleccionado, usa `loading="lazy"` y expone `Ver mas` para cargar la siguiente pagina. La imagen principal carga solo el item seleccionado.

## Signed URLs

El frontend no construye URLs de media. Usa `content_url`, `thumbnail_url`, `proxy_url` y `clip_url` devueltas por `vigilante-api` despues de resolver referencias con el media service. Si una imagen falla o expira, el boton `Renovar evidencia` vuelve a pedir la pagina visible de evidencia en `useControlCenterCases`.

## Streaming

No existe endpoint seguro de streaming en `vigilante-api`. `CameraTile` queda preparado para `snapshotUrl` seguro y actualmente usa la evidencia visual mas reciente de la camara o metadatos con claves explicitas `signed_snapshot_url`, `temporary_snapshot_url` o `signed_thumbnail_url`. No se leen `stream_url` ni rutas internas permanentes.

## Permisos

La ruta requiere `control-center:view`, alineado con roles de lectura sensible del backend: `analyst`, `operator`, `reviewer`, `supervisor`, `admin` y `auditor`. Las acciones criticas usan permisos existentes: `case:status` y `case:close`.

## Auditoria

Las acciones disponibles llaman endpoints de ciclo de vida existentes. El backend registra eventos de auditoria en timeline (`case_status_changed`, `case_closed`, `case_reopened`). Acciones sin endpoint seguro actual, como vincular perfil o unir caso con destino, quedan visibles pero deshabilitadas.
