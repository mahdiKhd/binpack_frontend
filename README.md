# PackLab frontend

PackLab is the Next.js frontend for the 3D bin-packing platform. It connects to the companion Django REST and WebSocket backend, lets a user configure containers and box types, run asynchronous packing algorithms, inspect layouts in 3D, and refine placements manually.

## Included features

- Responsive landing page, authentication, email verification, and account settings
- Project dashboard with create, rename, duplicate, and delete actions
- Container presets plus custom dimensions and weight capacity
- Box-type CRUD with quantity, color, weight, and rotation constraints
- Algorithm discovery, parameter controls, pack-job progress, cancellation, and results
- Persistent React Three Fiber viewport with orbit controls, selection, hover details, and camera reset
- Manual editor with click/drag insertion, mesh dragging, snapping, nudging, six orientations, undo/redo, floor drop, removal, and server-authoritative validation
- Layout history, metrics, comparison, deletion, and CSV/PDF/PNG export
- WebSocket notifications with reconnect and polling fallback
- Docker production image and Compose configuration

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- The PackLab Django backend running on `http://localhost:8000`
- Its Redis and Celery worker running when pack jobs are submitted

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The default environment values connect to the local backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/notifications/
```

These variables are embedded into the browser bundle at build time. Use public browser-reachable URLs, not Docker-only service names.

## Docker

Start the backend stack first, then run:

```bash
cp .env.example .env
docker compose -f compose.frontend.yaml up --build
```

The production frontend is available at `http://localhost:3000`. To use another backend, edit `.env` before building the image.

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Product landing page |
| `/login`, `/register` | Authentication |
| `/forgot-password`, `/reset-password` | Password recovery |
| `/verify-email` | Email verification token handling |
| `/dashboard` | Projects and quick statistics |
| `/projects/:id` | Setup, packing, editing, and layout history |
| `/settings/account` | Profile and password settings |

## 3D coordinate convention

The application and API use `X = length`, `Y = width/depth`, and `Z = height/up`. Three.js uses Y as its vertical axis, so the rendering boundary maps API coordinates `(x, y, z)` to Three.js `(x, z, y)`. The mapping remains localized in the 3D component; API and editor data always stay in the backend convention.

## Editor workflow

1. Run a packing algorithm or open a saved layout.
2. Add a box from the tray by clicking it, or drag it over the viewport.
3. Select a mesh to nudge it on each axis, rotate it, drop it to the floor, or remove it.
4. Use undo/redo while experimenting.
5. Choose **Save layout**. The backend performs authoritative bounds, overlap, stacking, weight, and quantity validation before storing the revision.

Dragging an existing box moves it horizontally while preserving its current height. Use **Drop to floor** or the Z controls for vertical changes.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The unit suite covers geometry/orientation checks, editor history, and authenticated request refresh behavior.

## Authentication notes

The access token is kept in memory and the rotating refresh token is kept in `sessionStorage`, limiting persistence to the current browser tab. On a 401 response, requests share a single refresh operation and retry once. For a later production hardening phase, the backend can move refresh tokens to `Secure`, `HttpOnly`, `SameSite` cookies.

## Project structure

```text
app/                 App Router pages and layouts
components/auth/     Authentication bootstrap and surfaces
components/layout/   Protected application shell
components/projects/ Dashboard project cards
components/three/    React Three Fiber scene and viewer
components/ui/       Reusable controls
components/workspace Setup, packing, editor, history, metrics
hooks/               WebSocket notifications
lib/                 API client and packing geometry
stores/              Zustand auth and editor state
types/               Backend contract types
__tests__/           Vitest unit tests
```

## Current MVP boundaries

- Box dragging is axis-aligned and intentionally uses explicit editor controls for height and orientation.
- Feasibility feedback in the browser is provisional; the backend remains the source of truth.
- PNG capture exports the layout currently loaded in the viewport. Open a history entry before exporting its image.
- Access and refresh tokens are cleared when the tab session ends or the user signs out.
