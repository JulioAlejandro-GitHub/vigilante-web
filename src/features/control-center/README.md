# Vigilante Control Center

Modulo visual aislado en `src/features/control-center`. La ruta `/control-center` es la entrada principal de la app y reemplaza la experiencia de reportes como primer punto de contacto.

## UX implementada

- Header operativo con modo vivo, estado API, operador, sitio, organización y timestamp de actualización.
- Mosaico principal de 6 cámaras con frame reciente desde ingestion, estado live, score y etiquetas recognition como capa posterior.
- Timeline lateral como cola viva de atención, ordenada por prioridad operacional y no solo por fecha.
- Panel de caso/sujeto activo auto-seleccionado desde el evento más relevante.
- Evidencia principal grande, reel lazy y comparación rápida de evidencias relacionadas.
- Insight de recognition en lenguaje operativo: identidad, rostro usable, recurrencia, cámaras, ventana temporal y score de riesgo.
- Acciones directas del operador: vincular perfil, marcar sospechoso, merge caso, resolver benigno, abrir revisión y ver detalle completo. Las acciones sin endpoint seguro quedan deshabilitadas con explicación.

## Endpoints usados

- `GET /health`: estado de servidor mostrado en el header.
- `GET /api/v1/dashboard/summary`: metricas operativas del header.
- `GET /api/v1/cameras?limit=6&offset=...`: camaras autorizadas, paginadas por el mosaico visible. La respuesta ya viene sanitizada por `vigilante-api`.
- `GET /api/v1/cameras/latest-frames?camera_id=...&include_media=true`: ultimo frame ingestado por camara visible, resuelto via media sin depender de timeline/recognition.
- `GET /api/v1/timeline?limit=20&offset=...&include_evidence=false`: eventos procesados recientes. El listado no resuelve media en bloque.
- `GET /api/v1/cases/{case_id}?expand=summary&include_evidence=false`: resumen barato del caso seleccionado.
- `GET /api/v1/cases/{case_id}/timeline?limit=6&offset=...&include_evidence=false`: cronologia paginada del caso seleccionado.
- `GET /api/v1/cases/{case_id}/evidence?limit=6&offset=...&source_event_id=...`: evidencia visual paginada y resuelta solo para el reel visible.
- `GET /api/v1/timeline/{source_event_id}/evidence?limit=6&offset=...`: evidencia visual paginada solo cuando el evento activo no tiene caso.
- `POST /api/v1/cases/{case_id}/status`: marcar sospechoso y resolver benigno.
- `POST /api/v1/cases/{case_id}/close` y `/reopen`: cierre y reapertura.

## SQL nuevo

No se agrego SQL ni migraciones. El modulo reutiliza tablas y proyecciones actuales: camaras, timeline, case_record, reviews, suggestions y evidencia resuelta por el media service.

## Priorizacion

La UI calcula un `priority.score` frontend para cada grupo de eventos con estas señales:

- `manual_review_required`
- `identity_conflict`
- `recurrent_unresolved_subject` o múltiples avistamientos
- `case_suggestion_created`
- severidad alta/crítica
- rostro usable sin identidad
- matches útiles
- evidencia visual declarada
- confianza alta
- múltiples cámaras

Los eventos se agrupan por `case_id`, luego por `subject_id` o `track_id` cuando no existe caso. La cola lateral ordena por score y usa fecha solo como desempate.

## Evidencia visual

La evidencia no se resuelve desde el listado inicial ni desde la cola lateral. El reel del caso/evento activo es el único consumidor inicial de evidencia resuelta: pide paginas de 6 items al endpoint de evidencia del caso o del evento seleccionado, usa `loading="lazy"` y expone `Ver mas` para cargar la siguiente pagina. La imagen principal carga solo el item seleccionado.

## Signed URLs

El frontend no construye URLs de media. Usa `content_url`, `thumbnail_url`, `proxy_url` y `clip_url` devueltas por `vigilante-api` despues de resolver referencias con el media service. Si una imagen falla o expira, el boton `Renovar evidencia` vuelve a pedir la pagina visible de evidencia en `useControlCenterCases`.

## Streaming / live feel

No se usa streaming pesado. El mosaico consulta en batch `latest-frames` solo para las camaras visibles:

- camara activa: hasta `VITE_LIVE_TILE_ACTIVE_MAX_FPS` fps, default `1`;
- camaras secundarias: hasta `VITE_LIVE_TILE_BACKGROUND_MAX_FPS` fps, default `0.4`;
- maximo concurrente: `VITE_LIVE_TILE_MAX_CONCURRENT_REFRESHES`, default `2`;
- si llegan varios frames entre renders, el cliente conserva el `latest_frame_at` mas nuevo.

La imagen del tile sale primero de ingestion (`frame.ingested`). Los eventos de recognition siguen llegando por timeline con `include_evidence=false` y solo enriquecen el tile con badges, labels, confidence y overlays cuando existen. Si una camara no fue iniciada por limite de concurrencia, el tile muestra el estado `no iniciada por concurrencia` cuando API recibe ese estado desde health de ingestion.

## Permisos

La ruta requiere `control-center:view`, alineado con roles de lectura sensible del backend: `analyst`, `operator`, `reviewer`, `supervisor`, `admin` y `auditor`. Las acciones criticas usan permisos existentes: `case:status` y `case:close`.

## Auditoria

Las acciones disponibles llaman endpoints de ciclo de vida existentes. El backend registra eventos de auditoria en timeline (`case_status_changed`, `case_closed`, `case_reopened`). Acciones sin endpoint seguro actual, como vincular perfil o unir caso con destino, quedan visibles pero deshabilitadas.
