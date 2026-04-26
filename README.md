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
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_DEFAULT_USER=julio
VITE_DEFAULT_ORGANIZATION_ID=
VITE_DEFAULT_SITE_ID=
```

En modo dev, Vite reenvía `/api/*` y `/health` a `VITE_API_BASE_URL`.

## Requisitos

Antes de usar la web, levantar `vigilante-api`:

```bash
cd ../vigilante-api
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

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
```

## Rutas

- `/` redirige a `/dashboard`
- `/dashboard`
- `/my-work`
- `/cases`
- `/cases/:caseId`
- `/manual-reviews`
- `/manual-reviews/:reviewId`
- `/case-suggestions`
- `/case-suggestions/:suggestionId`
- `/timeline`
- `/timeline/:sourceEventId`

## Slice 7

### Navegación

- App shell con sidebar en desktop.
- Drawer de navegación en móvil.
- Indicador visual de ruta activa.
- Menú de sesión mock con identidad, rol y contexto org/site.
- Links contextuales entre casos, reviews, suggestions, timeline y source events.
- Retorno a resultados con filtros preservados mediante query params.
- Entrada dedicada a `/my-work`.
- Rutas dedicadas para review, suggestion y timeline event.

### Sesión mock

La app usa `CurrentUserProvider` para mantener una sesión mock local preparada para migrar a auth real:

- default desde `VITE_DEFAULT_USER`
- persistencia en `localStorage` bajo `vigilante.session.v1`
- compatibilidad de lectura con el storage legacy `vigilante.currentUser`
- separación interna entre `identity`, `role` y `context`
- selector de identidad en header/drawer
- selector de rol mock
- edición de `organization_id` y `site_id` desde el drawer móvil
- `currentUser` derivado mantiene `name`, `username`, `role`, `organization_id` y `site_id`
- roles mock `analyst` y `supervisor`

Esa sesión se usa como default en:

- asignación/desasignación
- cambios de estado, cierre y reapertura
- notas de caso
- resolución de manual reviews
- resolución/promoción de case suggestions
- links de "My cases"

### RBAC visual mock

La UI expone una capa visual de permisos sin seguridad real de backend:

- `analyst`: asignarse casos, cambiar estado, agregar notas y resolver items de cola dentro de su contexto visual
- `supervisor`: reasignar/desasignar, cerrar/reabrir, promover suggestions, ejecutar bulk actions y operar cross-context
- acciones no disponibles se ocultan o se deshabilitan con hints claros
- el contexto org/site bloquea visualmente acciones de analyst cuando el item pertenece a otro contexto conocido

Esta capa prepara la app para auth/RBAC real sin introducir tokens ni sesiones reales.

### My Work

`/my-work` concentra trabajo personal:

- casos asignados al usuario actual
- casos `in_review` asignados al usuario actual
- manual reviews pendientes relevantes al contexto org/site actual
- case suggestions pendientes relevantes al contexto org/site actual
- quick filters por all/cases/queues
- quick actions a cases, reviews, suggestions y bulk assignment queue
- resumen visible de sesión mock y permisos

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
El panel de resolución usa el usuario actual como default en `resolved_by`.
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
El panel de acción usa el usuario actual como default en `resolved_by` y conserva retorno contextual al caso promovido.
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
- permisos visibles según rol mock
- acceso directo a My Work
- My cases
- Open cases
- Under review
- Pending manual reviews
- Pending case suggestions
- accesos a unassigned y timeline forense
- resumen del contexto mock de organization/site del usuario actual

### Tests frontend

La suite de Vitest cubre flujos críticos:

- `CurrentUserContext`
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

## Pendientes

- auth real
- RBAC real desde servidor
- CORS/configuración productiva en API
- usuario real desde auth backend
- visor real de media/evidencia conectado a endpoints backend
- catálogos reales de organization/site
- realtime con SSE/websocket
- validación más específica por tipo de review/suggestion
- edición avanzada de casos
- auditoría visual de bulk actions con historial propio
