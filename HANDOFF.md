# MarketOS Frontend Handoff

> Pick-up guide for the Next.js UI built against **existing** API routes.
> Last updated: 2026-07-15 · App lives in `MarketOs/`

---

## What this project is

**MarketOS** — mobile-first OS for Africa’s informal traders: passport identity, smart sale entry, dashboard analytics, receipt QR verify.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn/ui (base-sera) · React Hook Form · Zod · Recharts · Prisma/Postgres backend already present.

**Rules source of truth:** `github/.copilot-instruction.md` (no `.cursorrules` file on disk). Design: warm stone base + deep ochre accent (`--brand-accent`); Playfair Display + Noto Sans; square/underline sera components. Banned: cream+terracotta, near-black+acid green, broadsheet layouts.

---

## Route → API map (what actually exists)

| UI route | Auth | Data source |
|----------|------|-------------|
| `/` | — | Redirects: cookie `token` → `/dashboard`, else `/login` |
| `/login` | public | `POST /api/auth/login` → sets httpOnly `token` → `/dashboard` |
| `/register` | public | `POST /api/auth/register` then auto-login |
| `/dashboard` | required | `GET /api/ai` + `GET /api/products` (composed client-side; **no** `/api/dashboard`) |
| `/passport` | required | `GET /api/passport` (+ AI/products for stats). **Save is a no-op note** — no `POST /api/business` |
| `/passport/[businessId]` | public UX | Tries `GET /api/passport`; only works if logged-in owner’s `id` matches. **No** `GET /api/business/:id` |
| `/sales/new` | required | `POST /api/ai/parse` → edit list → per-item `POST /api/sales` → client receipt + QR |
| `/receipt/[receiptId]` | public | Query params / `sessionStorage` from sale QR. **No** `GET /api/receipt/:id` |

**Existing API routes only:**

```
POST /api/auth/register
POST /api/auth/login
GET  /api/passport
GET  /api/products · POST /api/products
POST /api/sales
GET  /api/ai
POST /api/ai/parse
```

**Documented in copilot rules but NOT implemented:**  
`/api/auth/verify-otp`, `GET|POST /api/business`, `GET /api/business/:id`, `GET /api/dashboard`, `GET /api/receipt/:id`.

---

## File map (frontend added)

```
lib/
  api.ts                 # fetch helpers, credentials: "include"
  types/api.ts           # shared response types
  validations/auth.ts
  validations/passport.ts
  validations/sale.ts
  utils.ts · db.ts       # pre-existing

app/
  layout.tsx             # MarketOS metadata, Playfair + Noto
  globals.css            # ochre/stone tokens + --brand-accent
  page.tsx               # auth redirect
  proxy.ts               # Next 16 auth gate (was middleware)
  actions/auth.ts        # server logout (clears httpOnly cookie)
  login/page.tsx
  register/page.tsx
  (app)/layout.tsx       # AppNav + content padding for bottom tabs
  (app)/dashboard/page.tsx
  (app)/passport/page.tsx
  (app)/sales/new/page.tsx
  passport/[businessId]/page.tsx   # public shell, no app nav
  receipt/[receiptId]/page.tsx     # public verify

components/
  app-nav.tsx            # md+: top nav · mobile: bottom tabs (Dashboard, Passport, Sale, Logout)
  page-header.tsx · loading-state.tsx · error-state.tsx · stat-card.tsx
  weekly-sales-chart.tsx · recent-activity-list.tsx
  sale-confirm-list.tsx · sale-receipt.tsx
  ui/  button · card · input · label · textarea
```

**Deps added:** `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`.

---

## Conventions to match

1. **API calls** — only via `lib/api.ts`; always `credentials: "include"`; throw on `{ error }` body.
2. **Auth** — JWT in httpOnly cookie `token` (payload: `userId`, `email`, `role`, `businessId`). Protected pages redirect to `/login` on 401.
3. **Forms** — React Hook Form + Zod resolvers; underline `Input`/`Textarea`; uppercase square `Button`.
4. **Errors** — never silent: every fetch has loading + visible error + retry where useful.
5. **Mobile** — bottom tab (`md:hidden`) + `main` `pb-28`; inputs `text-base` on mobile (anti-iOS-zoom); grids collapse at `sm`/`md`/`lg`.
6. **Do not invent** new product pages, OTP UI (unless API lands), or charts beyond dashboard numbers.

---

## Page behaviour notes

### Dashboard
- Stats: Revenue (`totalRevenue`), Sales Today (today’s chart point), Transactions (= chart day count), Products in Stock (sum of `product.stock`).
- Chart: Recharts line from `analytics.chartData` (`date`, `revenue`).
- Recent Activity: last 5 chart points; tip from `advisorTip`.
- Needs `GEMINI_API_KEY` server-side for `/api/ai`.

### Passport (owner)
- Prefills from `GET /api/passport`.
- Image upload is local preview (Data URL) only — not uploaded.
- “Save passport” surfaces message that `POST /api/business` is missing.
- Stats: sales days (chart length), reputation, stock units.
- Shows passport `qrCodeUrl` (Google Chart URL from API).

### Smart Sale
- Parse with 12s timeout; on fail/timeout → one empty manual row (graceful, not a dead-end).
- Confirm list: name, qty, unit, remove, “Add item manually”.
- Save loops `POST /api/sales` with `{ productId, quantity, paymentMethod }` (one product per request). Unmatched names must resolve against inventory or error.
- Receipt: client QR → `/receipt/{saleId}?amount=&seller=&ts=&items=`; also stored in `sessionStorage`.

### Public passport / receipt
- Intentionally degraded until missing GET endpoints exist.
- When adding backend: swap fetch targets; keep page structure.

---

## Auth gate

`proxy.ts` (Next 16 rename of middleware):

- Protects `/dashboard`, `/passport` (exact), `/sales/*`
- Allows `/passport/[id]` and `/receipt/*` public
- Logged-in users hitting `/login` or `/register` → `/dashboard`
- Logout: `logout()` → `app/actions/auth.ts` deletes cookie (client cannot clear httpOnly)

---

## Demo credentials (seed)

```
Email:    amina@marketos.com
Password: password123
```

Seed: `prisma/seed.ts`. Note: seed historically used `quantity` on products while schema uses `stock` — align if seed fails.

---

## Known backend mismatches (affect frontend)

1. `POST /api/sales` writes `status: "COMPLETED"` but Prisma `Sale` has no `status` field — may 500 until fixed.
2. Sales do **not** create `Transaction` / `receiptId` — QR verify is front-only until `/api/receipt/:id` exists.
3. Passport has **no POST/update** route.
4. Prisma client TS errors (`PrismaClient` export) appear if client not generated — run `npx prisma generate` / `npm run db:sync`.
5. Google Charts QR host allowlisted in `next.config.ts` `images.remotePatterns`.

---

## Suggested next work (priority)

1. **Implement missing APIs** to match `github/.copilot-instruction.md`:  
   `GET|POST /api/business`, `GET /api/business/:id`, `GET /api/dashboard`, `GET /api/receipt/:id`  
   Then thin the client: dashboard drop the AI+products compose; passport enable real save; public pages use public GETs; receipt use server verify.
2. **Fix `POST /api/sales`** to create `Transaction` + return `{ sale, receipt: { id, qrCodeUrl } }` and remove `status` write (or add field to schema).
3. **Wire passport image upload** once business POST accepts URL/base64.
4. **Optional:** OTP step only after `POST /api/auth/verify-otp` exists.
5. **Visual QA** on small phones (bottom tab + sale confirm grid).

---

## Run locally

```bash
cd MarketOs
npm install
# set DATABASE_URL, JWT_SECRET, GEMINI_API_KEY in .env
npm run db:sync   # if needed
npx prisma db seed  # if configured
npm run dev
```

Open `http://localhost:3000` → login → lands on `/dashboard`.

---

## Out of scope (do not build unless requested)

Forgot-password · product CRUD UI · low-stock alerts · settings · OTP (no API) · extra AI chart pages · inventing endpoints beyond the contract above.
