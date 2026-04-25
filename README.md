# vigilante-web

Primer slice funcional de UI operativa para analistas, consumiendo los endpoints actuales de `vigilante-api`.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Fetch API

## Variables de entorno

Crear `.env` desde `.env.example`:

```bash
cp .env.example .env
```

Valor esperado para desarrollo local:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

En modo dev, Vite proxy reenvia `/api/*` y `/health` a `VITE_API_BASE_URL` para evitar problemas de CORS mientras `vigilante-api` no tenga auth/CORS completo.

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

## Rutas UI

- `/` redirige a `/dashboard`
- `/dashboard`
- `/cases`
- `/cases/:caseId`
- `/manual-reviews`
- `/case-suggestions`
- `/timeline`

## Funcionalidad implementada

### Dashboard

Consume `GET /api/v1/dashboard/summary` y muestra:

- casos abiertos
- casos under_review
- manual reviews pendientes
- case suggestions pendientes
- totales de casos asignados/no asignados

### Cases

Consume `GET /api/v1/cases` con filtros:

- `status`
- `assigned_to`
- `priority`
- `severity`
- `case_type`
- `q`
- `limit`
- `offset`
- `sort_by`
- `sort_order`

El listado muestra título, tipo, estado, prioridad, severidad, owner y fecha de apertura.

### Case detail

Consume:

- `GET /api/v1/cases/{case_id}`
- `GET /api/v1/cases/{case_id}/timeline`
- `GET /api/v1/cases/{case_id}/notes`
- `GET /api/v1/cases/{case_id}/reviews`
- `GET /api/v1/cases/{case_id}/suggestions`

Acciones disponibles:

- asignar caso
- desasignar caso
- cambiar estado
- cerrar caso
- reabrir caso
- agregar nota

### Manual reviews

Consume `GET /api/v1/manual-reviews` y permite resolver con:

- `POST /api/v1/manual-reviews/{review_id}/resolve`

Para `identity_conflict` se muestra el campo adicional de resolución de identidad.

### Case suggestions

Consume `GET /api/v1/case-suggestions` y permite:

- resolver suggestion
- promover suggestion a caso

### Timeline

Consume `GET /api/v1/timeline` como vista de auditoría general.

## Pendientes

- auth real
- RBAC
- CORS/configuración productiva en API
- diseño de navegación por tenant/organización
- vistas dedicadas para media/evidencia
- realtime con SSE/websocket
- formularios más estrictos por tipo de review/suggestion
