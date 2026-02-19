# Laracom — Copilot Instructions

## Project Overview
Full-stack eCommerce platform: a **Laravel 12 REST API** (`laracom/`) and a **React 19 + TypeScript SPA** (`laracom-UI/`). They live in separate workspace folders.

## Architecture

### Frontend (`laracom-UI/`)
- **Routing**: TanStack Router with **file-based routing**. Routes live in `src/routes/`. The file `src/routeTree.gen.ts` is **auto-generated** — never edit it manually. Run `bun dev` to regenerate it.
- **API layer**: One shared Axios instance in `src/api/client.ts` (base URL `/api`). Each domain has its own module: `auth.ts`, `cart.ts`, `orders.ts`, `products.ts`, `reviews.ts`, `admin.ts`.
- **State**: Zustand (`src/store/auth.ts`) with `persist` middleware — key `laracom-auth`. Auth tokens are also mirrored to `localStorage` as `access_token` / `refresh_token` for the Axios interceptor.
- **UI**: Ant Design v6. Custom theme tokens in `src/theme/config.ts` (primary `#6366f1`). Always wrap admin pages in `<App>` from antd for message/notification context.
- **Path alias**: `@/` → `src/`.

### Backend (`laracom/`)
- **Pattern**: Thin controllers → Service classes → Eloquent models + API Resources. Business logic lives exclusively in `app/Services/`.
- **All controllers extend `BaseApiController`** which provides `success()`, `error()`, `created()`, `notFound()`, `paginatedResponse()` helpers. Never build `JsonResponse` manually in a controller.
- **Auth middleware**: `jwt.guard` (custom `JwtAuthMiddleware`). Admin routes use `role:admin` (`RoleMiddleware`).
- **Response envelope** — single: `{ success, message, data: T }` | paginated: `{ success, message, data: T[], meta: { current_page, last_page, per_page, total } }` | error: `{ success: false, error, errorCode, fieldErrors? }`.

## Key Cross-Cutting Patterns

### JWT + Guest Cart Flow
- On login/register, `AuthController` merges the guest cart via `CartService::mergeGuestCart()` using the `X-Session-ID` header.
- `setAuth()` in the Zustand store clears `session_id` from localStorage after merge.
- `CartController` identifies requests by JWT (authenticated) or `X-Session-ID` header (guest). Both paths use the same service methods.

### API Client Auto-Refresh (Frontend)
`src/api/client.ts` queues 401 failures, refreshes the token via `/auth/refresh-token`, then replays them. On refresh failure it clears storage and redirects to `/auth/login`.

### Admin Protection
- **Frontend**: Wrap the layout route in `<AuthGuard requireAdmin>` (see `src/routes/admin/_layout.tsx`).
- **Backend**: Add `->middleware('jwt.guard', 'role:admin')` to the route group in `routes/api.php`.

### Error Handling (Frontend)
Use helpers from `src/lib/error.ts`: `getErrorMessage(err)` for toast messages, `getFieldErrors(err)` for form field errors. Both handle Axios errors, network errors, and plain `Error` objects.

## Developer Workflows

### Frontend
```bash
cd laracom-UI
bun dev          # dev server on :3000, proxies /api → localhost:8000
bun run build    # tsc -b && vite build
bun run lint
```

### Backend
```bash
cd laracom
composer dev     # concurrently: php artisan serve (:8000) + queue:listen + pail + vite
composer test    # clears config cache then runs Pest
php artisan migrate:fresh --seed   # reset DB
```
Initial setup: `composer setup` (installs deps, copies `.env`, migrates, builds assets).

## Adding New Features — Checklist
1. **Backend**: Add `FormRequest` → Service method → Controller method (using `BaseApiController` helpers) → `ApiResource` → register route in `api.php`.
2. **Frontend**: Add type to `src/types/index.ts` → API function in the relevant `src/api/*.ts` module → TanStack Query hook inside the route component → render with Ant Design components using the custom theme.

## Key Files
| File | Purpose |
|------|---------|
| `laracom-UI/src/api/client.ts` | Axios instance, token injection, auto-refresh |
| `laracom-UI/src/store/auth.ts` | Zustand auth store (persisted) |
| `laracom-UI/src/types/index.ts` | All shared TypeScript interfaces |
| `laracom-UI/src/lib/error.ts` | Error extraction utilities |
| `laracom-UI/src/theme/config.ts` | Ant Design theme tokens |
| `laracom/app/Http/Controllers/Api/BaseApiController.php` | Response helper methods |
| `laracom/app/Services/` | All business logic |
| `laracom/routes/api.php` | All API routes |
