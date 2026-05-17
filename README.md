# vigilante-web

UI operativa para analistas que consume los endpoints actuales de `vigilante-api`.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Fetch API

## Configuración

Crear `.env` desde `.env.example`:

```bash
cp .env.example .env
```

Valor esperado para desarrollo local:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8001
```

En modo dev, Vite reenvía `/api/*` y `/health` a `VITE_API_BASE_URL`.

## Requisitos

Antes de usar la web, levantar `vigilante-api`. Para evidencia visual real, levantar también `vigilante-media` y exponerlo al API:

```bash
cd ../vigilante-media
source .venv/bin/activate
MEDIA_LOCAL_ROOTS=storage,../vigilante-ingestion/storage,../vigilante-recognition \
PYTHONPATH=. uvicorn app.main:app --host 127.0.0.1 --port 8110
```

En otra terminal:

```bash
cd ../vigilante-api
source .venv/bin/activate
MEDIA_SERVICE_BASE_URL=http://127.0.0.1:8110 \
MEDIA_SERVICE_PUBLIC_BASE_URL=http://127.0.0.1:8110 \
INGESTION_OUTBOX_PATH=../vigilante-ingestion/outbox/frame_ingested.jsonl \
INGESTION_HEALTH_BASE_URL=http://127.0.0.1:8088 \
PYTHONPATH=. uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Para login, la BD de `vigilante-api` debe tener usuarios reales en
`auth.app_user` con roles y scopes válidos. La web no depende de datos
artificiales.

## Instalación y ejecución

```bash
npm install
npm run build
npm run dev
```

La app queda disponible en:

```bash
http://127.0.0.1:5173
```

## Validación

```bash
npm run test
npm run build
npm run dev
```

Validación visual esperada con media local:

- abrir `/control-center` y confirmar que la primera pantalla se comporta como Centro de Control live-first;
- ver mosaico de cámaras con frame reciente desde ingestion antes de recognition, cola lateral priorizada, caso/sujeto activo, evidencia principal, insight de recognition y acciones;
- confirmar que los badges de recognition aparecen encima/asociados al frame live cuando el evento procesado ya existe;
- confirmar estados `live`, `online`, `degraded`, `sin snapshot`, `offline` y `no iniciada por concurrencia` cuando ingestion reporta health;
- confirmar que eventos críticos, revisión manual, conflictos de identidad, recurrencia y matches aparecen por encima de eventos recientes de baja relevancia;
- abrir un caso, manual review, case suggestion o timeline event con `evidence_media`;
- ver preview liviano usando `thumbnail_url` en el panel `Visual evidence`;
- abrir el viewer ampliado con `content_url` original y metadata;
- ver `Temporal clips` cuando `vigilante-api` expone `clip_available=true`;
- reproducir el MP4 derivado con controles nativos del navegador;
- confirmar fallback textual cuando solo existan `evidence_refs` o cuando la imagen falle.

## Rutas

- `/login` es pública
- `/` redirige a `/control-center` después de una sesión válida
- `/control-center`
- `/dashboard`
- `/my-work`
- `/cases`
- `/cases/:caseId`
- `/manual-reviews`
- `/manual-reviews/:reviewId`
- `/camera-recommendations`
- `/case-suggestions`
- `/case-suggestions/:suggestionId`
- `/timeline`
- `/timeline/:sourceEventId`

Todas las rutas salvo `/login` requieren una sesión válida obtenida contra `vigilante-api`.

## Auth real

La app usa auth real contra `vigilante-api` por defecto:

- `POST /api/v1/auth/login` para obtener JWT.
- JWT persistido en `localStorage` bajo `vigilante.auth.token.v1`.
- `GET /api/v1/auth/me` para cargar el usuario actual real.
- `POST /api/v1/auth/logout` antes de limpiar sesión local.
- `Authorization: Bearer <token>` en requests protegidos bajo `/api/v1`.

`AuthProvider` es la fuente central de sesión. `CurrentUserProvider` se mantiene como fachada de compatibilidad para las pantallas existentes, pero ya no usa identidad/rol/contexto mock como modo principal.

La UI usa el usuario de `/auth/me` para:

- ownership relativo a `currentUser.username`;
- `assigned_by`, `changed_by`, `author` y `resolved_by` enviados por formularios;
- permisos visuales según `role`/`roles`;
- scope visible de organizaciones/sitios devuelto por backend.

Manejo de errores auth:

- `401`: se considera sesión inválida/expirada, se limpia el token local y las rutas privadas vuelven a `/login`.
- `403`: se muestra como acceso denegado o como acción deshabilitada cuando el rol/scope real no permite operar.
- login fallido: muestra error visible sin crear sesión local.

## Evidencia visual real

La web consume la evidencia enriquecida que entrega `vigilante-api` en `evidence_media` para casos, manual reviews, case suggestions y timeline events.

- Usa `thumbnail_url` para previews/cards/galerías cuando está disponible.
- Usa `content_url` para el viewer ampliado, manteniendo la imagen original completa.
- Si falta thumbnail, el preview cae a `content_url`; si también falta, cae al fallback técnico de `evidence_refs`.
- Si `clip_available=true`, muestra badge de clip y un panel `Temporal clips` con reproductor HTML5 usando `clip_url`.
- Si el clip no existe o falla al cargar, conserva el flujo de imagen con `content_url`/`thumbnail_url`.
- No se conecta directo a MinIO/S3 ni expone credenciales de storage.
- Mantiene `evidence_refs` como fallback textual cuando no hay media resuelta.
- Si la URL de imagen falla, muestra placeholder y conserva la evidencia técnica/payload.
- El viewer forense permite zoom in/out, reset, pan por arrastre cuando la imagen está ampliada y navegación prev/next sin recargar la página.
- El viewer usa una tira de thumbnails para conservar contexto entre múltiples evidencias y un compare mode simple para contrastar la imagen actual con la siguiente/anterior.
- La metadata visual se presenta por grupos operativos: identidad/captura, delivery de imagen, resolución/fallback, timestamps e integridad.

## Slice 7

### Navegación

- App shell con sidebar en desktop.
- Drawer de navegación en móvil.
- Indicador visual de ruta activa.
- Menú de sesión autenticada con identidad, rol, scope org/site y logout.
- Links contextuales entre casos, reviews, suggestions, timeline y source events.
- Retorno a resultados con filtros preservados mediante query params.
- Entrada dedicada a `/my-work`.
- Rutas dedicadas para review, suggestion y timeline event.

### Sesión real

La app usa `AuthProvider` para mantener la sesión real:

- login real con `POST /api/v1/auth/login`
- persistencia de JWT en `localStorage` bajo `vigilante.auth.token.v1`
- carga de usuario actual con `GET /api/v1/auth/me`
- limpieza local y `POST /api/v1/auth/logout`
- `currentUser` mantiene `user_id`, `username`, `email`, `display_name`, `role`, `roles`, `organization_ids`, `site_ids` y `scopes`
- roles soportados visualmente como mínimo: `analyst` y `supervisor`

Esa sesión se usa en:

- asignación/desasignación
- cambios de estado, cierre y reapertura
- notas de caso
- resolución de manual reviews
- resolución/promoción de case suggestions
- approve/reject/apply/rollback de camera recommendations
- links de "My cases"

## Camera recommendations

`/camera-recommendations` cierra el loop humano del workflow de recomendaciones de cámara expuesto por `vigilante-api`.

Consume:

- `GET /api/v1/camera-recommendations`
- `GET /api/v1/camera-recommendations/{recommendation_id}`
- `GET /api/v1/camera-recommendations/{recommendation_id}/preview`
- `POST /api/v1/camera-recommendations/{recommendation_id}/approve`
- `POST /api/v1/camera-recommendations/{recommendation_id}/reject`
- `POST /api/v1/camera-recommendations/{recommendation_id}/apply`
- `POST /api/v1/camera-recommendations/{recommendation_id}/rollback`

La vista incluye:

- listado con badges de estado, severidad, `actionable` y `auto_apply`
- filtros por `status`, `camera_id`, `recommendation_type`, `severity` y búsqueda local por id/cámara/título/razón
- detalle con evidencia, valores actuales/propuestos, métricas, resumen de ventana y metadata paths
- preview del patch con path afectado, valor actual, valor esperado, valor propuesto, stale/applicable y errores de validación
- acciones con confirmación y comentario opcional según estado: `pending` -> approve/reject, `approved` -> apply, `applied` -> rollback
- auditoría básica del último evento `workflow` y link al timeline filtrado por cámara

La UI no implementa lógica de workflow propia; solo presenta estado y ejecuta las transiciones del API.

### RBAC visual

La UI refleja los permisos más cercanos al RBAC real del backend:

- `analyst`: asignarse casos, cambiar estado, agregar notas y resolver items de cola dentro de su scope autenticado
- `supervisor`: reasignar/desasignar, cerrar/reabrir, promover suggestions y ejecutar bulk actions dentro de su scope autenticado
- acciones no disponibles se ocultan o se deshabilitan con hints claros
- el scope org/site bloquea visualmente acciones cuando el item pertenece a otro contexto conocido
- roles backend compatibles como `admin`, `operator` o `reviewer` se mapean al perfil visual más cercano

### My Work

`/my-work` concentra trabajo personal:

- casos asignados al usuario actual
- casos `in_review` asignados al usuario actual
- manual reviews pendientes relevantes al contexto org/site actual
- case suggestions pendientes relevantes al contexto org/site actual
- quick filters por all/cases/queues
- quick actions a cases, reviews, suggestions y bulk assignment queue
- resumen visible de sesión real y permisos

### Filtros persistentes

Las vistas principales sincronizan filtros con query params:

- `/cases`
- `/manual-reviews`
- `/case-suggestions`
- `/timeline`
- `/my-work` preserva retorno contextual hacia listas y detalles
- `/manual-reviews/:reviewId`, `/case-suggestions/:suggestionId` y `/timeline/:sourceEventId` usan `returnTo`

Esto conserva filtros, orden y paginación al volver desde un detalle o compartir una URL.

El Slice 5 agrega preservación adicional de contexto:

- detalle de caso con `tab` persistente en URL
- manual reviews con panel seleccionable por `review_id`
- case suggestions con panel seleccionable por `suggestion_id`
- timeline con deep link por `source_event_id`
- links a caso con `returnTo` para volver a la lista o cola filtrada

El Slice 7 consolida deep links dedicados:

- `reviewHref()` apunta a `/manual-reviews/:reviewId`
- `suggestionHref()` apunta a `/case-suggestions/:suggestionId`
- `timelineEventHref()` apunta a `/timeline/:sourceEventId`
- los helpers legacy de cola siguen disponibles para abrir paneles laterales con query params

### Cases

Consume `GET /api/v1/cases` con:

- `status`
- `assigned_to`
- `priority`
- `severity`
- `case_type`
- `organization_id`
- `site_id`
- `q`
- `limit`
- `offset`
- `sort_by`
- `sort_order`

La vista usa tabla en desktop y cards en móvil/tablet angosto.
Incluye atajos de trabajo para:

- assigned to me
- assigned to someone else
- unassigned
- open
- under review
- current org/site context

El estado visual de ownership se muestra como:

- assigned to me
- assigned to someone else
- unassigned

La lista soporta selección múltiple y bulk actions cliente-side:

- assign to me
- unassign
- change status

Las bulk actions se deshabilitan para roles sin permiso visual y muestran el motivo.

### Case detail

Consume:

- `GET /api/v1/cases/{case_id}`
- `GET /api/v1/cases/{case_id}/timeline`
- `GET /api/v1/cases/{case_id}/notes`
- `GET /api/v1/cases/{case_id}/reviews`
- `GET /api/v1/cases/{case_id}/suggestions`

Acciones disponibles con validación básica y refresh posterior:

- asignar caso
- desasignar caso
- cambiar estado
- cerrar caso
- reabrir caso
- agregar nota

El detalle funciona como workspace forense con pestañas persistentes:

- overview
- timeline
- notes
- reviews
- suggestions
- evidence

Incluye header de caso, bloque de ownership, breadcrumbs/back to results y panel de acciones con defaults del usuario actual.
Desde el caso se puede navegar a reviews/suggestions relacionadas, source event y timeline sin perder el contexto de retorno.
El Slice 6/7 agrega:

- owner actual más visible
- `AssignmentActions` con assign to me, unassign y reassign
- `OwnershipHistoryPreview` inferido desde eventos `case_assigned`, `case_reassigned` y `case_unassigned`
- chips de organization/site en header y overview
- `EvidenceWorkspace` para la pestaña evidence
- links de reviews/suggestions/timeline hacia rutas dedicadas
- panel de evidencia preparado para futuro visor multimedia

### Manual reviews

Consume:

- `GET /api/v1/manual-reviews`
- `GET /api/v1/manual-reviews/{review_id}`
- `POST /api/v1/manual-reviews/{review_id}/resolve`

Soporta filtros por URL, listado responsive, detalle lateral enlazable con `review_id` y campos condicionales para `identity_conflict`.
El panel de resolución usa el usuario autenticado real en `resolved_by`.
El Slice 6 agrega quick filters, filtro cliente-side por contexto org/site, columna/chips de org/site, cierre explícito del detalle lateral y bulk approve con permiso visual.
El Slice 7 agrega `/manual-reviews/:reviewId` como detalle dedicado con breadcrumbs, back contextual, `EntityHeader`, `InvestigationContextPanel`, `RelatedLinksPanel`, `EvidenceWorkspace` y acción de resolve.
El detalle muestra contexto operativo enriquecido:

- source event con link a timeline
- relación con caso si viene en payload/resolution payload
- subject, track, camera
- severity/priority
- organization/site
- reason summary
- resumen de evidencia técnica
- payload técnico expandible

La cola soporta selección múltiple y bulk approve secuencial.

### Case suggestions

Consume:

- `GET /api/v1/case-suggestions`
- `GET /api/v1/case-suggestions/{suggestion_id}`
- `POST /api/v1/case-suggestions/{suggestion_id}/resolve`
- `POST /api/v1/case-suggestions/{suggestion_id}/promote`

Incluye filtros por URL, detalle lateral enlazable con `suggestion_id`, resolución y promoción con campos mínimos editables.
El panel de acción usa el usuario autenticado real en `resolved_by` y conserva retorno contextual al caso promovido.
El Slice 6 agrega quick filters, filtro cliente-side por contexto org/site, columna/chips de org/site, cierre explícito del detalle lateral y bulk accept/defer/reject con permiso visual.
El Slice 7 agrega `/case-suggestions/:suggestionId` como detalle dedicado con breadcrumbs, back contextual, `EntityHeader`, `InvestigationContextPanel`, `RelatedLinksPanel`, `EvidenceWorkspace`, resolve y promote.
El detalle muestra contexto enriquecido:

- suggestion type
- evidence count
- source event con link a timeline
- caso relacionado si ya fue promovida
- subject, track, camera
- organization/site
- suggested title/reason/priority/severity si viene en payload
- resumen de evidencia técnica
- payload técnico expandible

La cola soporta selección múltiple y bulk accept/defer/reject secuencial.

### Evidencia técnica

`EvidenceWorkspace`, `EvidenceSection` y `EvidenceSummary` presentan evidencia técnica en bloques legibles antes del JSON crudo:

- `face_detection`
- `semantic_descriptor`
- `match_confidence`
- `generation_trace`
- `recurrent_subject_assessment`
- `source_event`
- `confidence`
- `evidence_count`
- `decision_reason`

El JSON completo queda detrás de un bloque expandible para evitar ruido visual.
También existe un placeholder explícito para futuro visor de media real, sin inventar endpoints ni datos.
El Slice 6 extrae ese slot en `MediaPlaceholderPanel`.
El Slice 7 agrega `MediaReadyPanel` y un patrón reusable:

- resumen rápido arriba
- evidencia técnica estructurada
- placeholder media-ready lateral
- payload completo colapsable

Ese patrón se usa en detalle de caso, review, suggestion y timeline event.

### Timeline

Consume `GET /api/v1/timeline` con filtros por:

- `event_type`
- `source_event_id`
- `case_id`
- `camera_id`
- `subject_id`
- `organization_id`
- `site_id`
- `limit`

Si `source_event_id` está presente, la vista puede consumir `GET /api/v1/timeline/{source_event_id}` desde el filtro legacy.
Los eventos muestran tipo, severidad, fecha, resumen, metadata operativa, evidencia técnica expandible y links rápidos a caso, review o suggestion cuando esos ids están disponibles en el payload.
Los links preservan retorno contextual con la URL filtrada del timeline.
El Slice 6 agrega:

- `EventTypeBadge` para distinguir eventos operativos y técnicos
- filtros rápidos por all/operational/technical/assignments/my context
- badges de ownership para eventos de asignación
- org/site visible con chips
- mayor densidad visual por evento

El Slice 7 agrega `/timeline/:sourceEventId` como detalle dedicado con:

- `EventMetadataPanel`
- `SourceTracePanel`
- `EvidenceWorkspace`
- links a case/review/suggestion/source event
- breadcrumbs y back contextual

### Dashboard

El dashboard queda orientado a investigación y operación diaria:

- Session summary card
- permisos visibles según rol real de `/auth/me`
- acceso directo a My Work
- My cases
- Open cases
- Under review
- Pending manual reviews
- Pending case suggestions
- accesos a unassigned y timeline forense
- resumen del scope organization/site del usuario autenticado

### Tests frontend

La suite de Vitest cubre flujos críticos:

- `CurrentUserContext` como compatibilidad sobre sesión autenticada
- cliente API con bearer token y notificación de `401`
- `OwnerBadge`
- navegación contextual básica
- filtros persistentes por query params
- lista principal de casos
- acción operativa de assignment
- detalle de caso con evidencia y slot multimedia futuro
- rutas dedicadas de review
- rutas dedicadas de suggestion
- detalle dedicado de timeline event
- acción crítica de resolve desde detalle
- `EvidenceWorkspace`

Validado con:

```bash
npm run test
npm run build
npm run dev
```

### Logging operativo

`vigilante-web` no tiene runtime de servidor propio más allá de Vite en local.
La política INFO/DEBUG aplica en los servicios Python (`api`, `media`,
`ingestion`, `recognition`).

## Pendientes

- CORS/configuración productiva en API
- refresh tokens/renovación silenciosa
- MFA, SSO/OIDC y recuperación de contraseña
- gestión admin de usuarios desde frontend
- auth para futuras conexiones realtime
- visor real de media/evidencia conectado a endpoints backend
- catálogos reales de organization/site
- realtime con SSE/websocket
- validación más específica por tipo de review/suggestion
- edición avanzada de casos
- auditoría visual de bulk actions con historial propio
