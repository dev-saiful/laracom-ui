# Laracom — Copilot Instructions

## Project Overview
Full-stack eCommerce platform: a **Laravel 12 REST API** (`laracom/`) and a **React 19 + TypeScript SPA** (`laracom-UI/`). They live in separate workspace folders.

## Architecture

### Frontend (`laracom-UI/`)
- **Routing**: TanStack Router with **file-based routing**. Routes live in `src/routes/`. The file `src/routeTree.gen.ts` is **auto-generated** — never edit it manually. Run `bun dev` to regenerate it.
- **API layer**: One shared Axios instance in `src/api/client.ts` (base URL `/api`). Domain modules: `auth.ts`, `cart.ts`, `orders.ts`, `products.ts`, `reviews.ts`, `wishlist.ts`, `admin.ts`. The `admin.ts` module uses nested namespaces: `adminApi.products.*`, `adminApi.orders.*`, `adminApi.users.*`, `adminApi.inventory.*`, `adminApi.categories.*`, `adminApi.coupons.*`, `adminApi.settings.*`.
- **State**: Zustand (`src/store/auth.ts`) with `persist` middleware — key `laracom-auth`. Auth tokens are also mirrored to `localStorage` as `access_token` / `refresh_token` for the Axios interceptor.
- **UI**: Ant Design v6. Custom theme tokens in `src/theme/config.ts` (primary `#6366f1`). Always wrap admin pages in `<App>` from antd for message/notification context.
- **React Compiler** is enabled — avoid manual `useMemo`/`useCallback` optimisations.
- **Path alias**: `@/` → `src/`.

### Backend (`laracom/`)
- **Pattern**: Thin controllers → Service classes → Eloquent models + API Resources. Business logic lives exclusively in `app/Services/`.
- **All controllers extend `BaseApiController`** which provides `success()`, `created()`, `error()`, `notFound()`, `unauthorized()`, `forbidden()`, `paginatedResponse()`. Never build `JsonResponse` manually.
- **Auth middleware**: `jwt.guard` (custom `JwtAuthMiddleware`). Admin routes use `role:admin` (`RoleMiddleware`).
- **Response envelope** — single: `{ success, message, data: T }` | paginated: `{ success, message, data: T[], meta: { current_page, last_page, per_page, total, from, to } }` | error: `{ success: false, error, errorCode, fieldErrors? }`.
- **Image uploads**: `UploadService` wraps Cloudinary via `cloudinary-labs/cloudinary-laravel`. Admin-only endpoint: `POST /api/upload` → returns `{ url, public_id }`. Delete via `DELETE /api/upload`.
- **Telegram notifications**: `TelegramService` sends order alerts on checkout. Configured via `services.telegram.*` config keys. Admin can test via `GET /api/admin/settings/telegram/status` and `POST /api/admin/settings/telegram/test`.

## Key Cross-Cutting Patterns

### Registration & OTP Email Verification
`POST /auth/register` creates the user and sends a 6-digit OTP email. The client must then call `POST /auth/verify-otp` before the account is active. Re-send via `POST /auth/resend-otp`. Password reset follows a similar email OTP flow via `POST /auth/forgot-password` → `POST /auth/reset-password`.

### JWT + Guest Cart Flow
- On login/register, `AuthController` merges the guest cart via `CartService::mergeGuestCart()` using the `X-Session-ID` header.
- `setAuth()` in the Zustand store clears `session_id` from localStorage after merge.
- `CartController` identifies requests by JWT (authenticated) or `X-Session-ID` header (guest). Both paths use the same service methods.
- Guest checkout is supported via `POST /orders/guest-checkout` (no auth required). Order tracking for all users: `GET /orders/track/{number}`.

### API Client Auto-Refresh (Frontend)
`src/api/client.ts` queues 401 failures, refreshes the token via `/auth/refresh-token`, then replays them. On refresh failure it clears storage and redirects to `/auth/login`.

### Admin Protection
- **Frontend**: Wrap the layout route in `<AuthGuard requireAdmin>` (see `src/routes/admin/_layout.tsx`).
- **Backend**: Add `->middleware('jwt.guard', 'role:admin')` to the route group in `routes/api.php`.

### Wishlist (auth-only)
Wishlist routes require `jwt.guard`. Frontend uses `wishlistApi` from `src/api/wishlist.ts`. Use `wishlistApi.check(productId)` to show add/remove button state without fetching the full list.

### Coupons
Public validation endpoint: `POST /api/coupons/validate` (throttled 20/min). Admin manages coupons under `/api/admin/coupons/*`. Frontend calls this during checkout before order submission.

### Address Book
Full CRUD at `/api/addresses/*` (auth-only). `PATCH /addresses/{id}/default` sets a default address. Used to pre-fill checkout shipping fields.

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
| `laracom-UI/src/api/admin.ts` | Nested admin API namespace |
| `laracom-UI/src/api/wishlist.ts` | Wishlist API module |
| `laracom-UI/src/store/auth.ts` | Zustand auth store (persisted) |
| `laracom-UI/src/types/index.ts` | All shared TypeScript interfaces |
| `laracom-UI/src/lib/error.ts` | Error extraction utilities |
| `laracom-UI/src/theme/config.ts` | Ant Design theme tokens |
| `laracom/app/Http/Controllers/Api/BaseApiController.php` | Response helper methods |
| `laracom/app/Services/` | All business logic (Auth, Cart, Order, Product, Wishlist, Coupon, Shipping, Telegram, Upload, Otp) |
| `laracom/routes/api.php` | All API routes |
