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
- `/cases`
- `/cases/:caseId`
- `/manual-reviews`
- `/case-suggestions`
- `/timeline`

## Slice 5

### Navegación

- App shell con sidebar en desktop.
- Drawer de navegación en móvil.
- Indicador visual de ruta activa.
- Selector simple de usuario actual simulado en el shell.
- Links contextuales entre casos, reviews, suggestions, timeline y source events.
- Retorno a resultados con filtros preservados mediante query params.

### Current user simulado

La app usa `CurrentUserProvider` para mantener un usuario actual local:

- default desde `VITE_DEFAULT_USER`
- persistencia en `localStorage`
- selector en header/drawer
- perfil mock con `name`, `role`, `organization_id` y `site_id`
- roles mock `analyst` y `supervisor`

Ese usuario se usa como default en:

- asignación/desasignación
- cambios de estado, cierre y reapertura
- notas de caso
- resolución de manual reviews
- resolución/promoción de case suggestions
- links de "My cases"

### RBAC visual mock

La UI expone una capa visual de permisos sin seguridad real de backend:

- `analyst`: acciones operativas normales y bulk actions básicas
- `supervisor`: misma operación y señales administrativas adicionales en dashboard

Esta capa prepara la app para auth/RBAC real sin introducir tokens ni sesiones reales.

### Filtros persistentes

Las vistas principales sincronizan filtros con query params:

- `/cases`
- `/manual-reviews`
- `/case-suggestions`
- `/timeline`

Esto conserva filtros, orden y paginación al volver desde un detalle o compartir una URL.

El Slice 5 agrega preservación adicional de contexto:

- detalle de caso con `tab` persistente en URL
- manual reviews con panel seleccionable por `review_id`
- case suggestions con panel seleccionable por `suggestion_id`
- timeline con deep link por `source_event_id`
- links a caso con `returnTo` para volver a la lista o cola filtrada

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
- unassigned
- open
- under review

El estado visual de ownership se muestra como:

- assigned to me
- assigned to someone else
- unassigned

La lista soporta selección múltiple y bulk actions cliente-side:

- assign to me
- unassign
- change status

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

### Manual reviews

Consume:

- `GET /api/v1/manual-reviews`
- `GET /api/v1/manual-reviews/{review_id}`
- `POST /api/v1/manual-reviews/{review_id}/resolve`

Soporta filtros por URL, listado responsive, detalle lateral enlazable con `review_id` y campos condicionales para `identity_conflict`.
El panel de resolución usa el usuario actual como default en `resolved_by`.
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

`EvidenceSection` y `EvidenceSummary` presentan evidencia técnica en bloques legibles antes del JSON crudo:

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

Si `source_event_id` está presente, la vista consume `GET /api/v1/timeline/{source_event_id}`.
Los eventos muestran tipo, severidad, fecha, resumen, metadata operativa, evidencia técnica expandible y links rápidos a caso, review o suggestion cuando esos ids están disponibles en el payload.
Los links preservan retorno contextual con la URL filtrada del timeline.

### Dashboard

El dashboard queda orientado a investigación y operación diaria:

- My cases
- Open cases
- Under review
- Pending manual reviews
- Pending case suggestions
- accesos a unassigned y timeline forense
- resumen del contexto mock de organization/site del usuario actual

## Pendientes

- auth real
- RBAC real desde servidor
- CORS/configuración productiva en API
- usuario actual desde sesión
- visor real de media/evidencia conectado a endpoints backend
- rutas dedicadas de detalle si el backend expone ids navegables para reviews/suggestions
- catálogos reales de organization/site
- realtime con SSE/websocket
- validación más específica por tipo de review/suggestion
- edición avanzada de casos
- auditoría visual de bulk actions con historial propio
