# ForkHub - Simple Food Ordering System
## Comprehensive Defense Study Guide

---

## TABLE OF CONTENTS
1. [Project Overview](#1-project-overview)
2. [Tech Stack & Why](#2-tech-stack--why)
3. [Project Structure (File Tree)](#3-project-structure)
4. [Complete File-by-File Breakdown](#4-complete-file-by-file-breakdown)
5. [How Paths Work](#5-how-paths-work)
6. [How the Request/Data Flow Works](#6-how-the-requestdata-flow-works)
7. [Authentication Flow (Deep Dive)](#7-authentication-flow)
8. [Order Placement Flow (Deep Dive)](#8-order-placement-flow)
9. [Admin Operations Flow](#9-admin-operations-flow)
10. [Data Models & File Storage](#10-data-models--file-storage)
11. [Key Function Map (What to Cite)](#11-key-function-map)
12. [Potential Defense Q&A](#12-potential-defense-qa)

---

## 1. PROJECT OVERVIEW

**ForkHub** is a full-stack web application for online food ordering. Customers can:
- Browse menu items by category (Pizza, Pasta, Chicken, Sides, Desserts, Beverages, Extras)
- Customize items (size, quantity, notes)
- Add items to a cart (persisted in browser localStorage)
- Choose Delivery or Pick Up
- Place orders and track them via order ID or phone number
- Create/manage accounts
- Admin users can manage menu items, update order statuses, and manage user accounts

**Key architectural decisions:**
- JSON file storage by default (no database setup needed), with optional PostgreSQL for orders
- JWT-based authentication with bcrypt password hashing
- React 19 frontend (Vite) + Express 5 backend
- Vite proxy for dev (avoids CORS issues during development)
- Cross-tab auth/cart synchronization via custom DOM events

---

## 2. TECH STACK & WHY

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + JSX | Component-based UI framework |
| **Build Tool** | Vite 8 | Fast dev server + HMR, ES module bundling |
| **Routing** | React Router DOM 7 | Client-side page navigation |
| **Backend** | Express 5 | REST API server |
| **Auth** | jsonwebtoken + bcrypt | Token-based auth + password hashing |
| **Storage** | JSON files (default) / PostgreSQL (optional) | No external DB required to run |
| **File Upload** | multer | Image upload for menu items |
| **Maps** | Leaflet (CDN) + Nominatim API | Delivery address geocoding & map |
| **CSS** | Custom monolith (single App.css, ~6100 lines) | All styling in one file |

**Why JSON files?** The project is designed to run without setting up a database. JSON files in `data/` serve as the persistence layer. PostgreSQL is optionally supported for orders when `DATABASE_URL` is set.

---

## 3. PROJECT STRUCTURE

```
forkhub/
├── index.html                         # Vite entry HTML
├── vite.config.js                     # Vite config (proxy /api and /images to :3001)
├── package.json                       # Scripts & dependencies
│
├── server/                            # BACKEND (Express.js)
│   ├── index.js                       # Entry point: starts listening on port 3001
│   ├── app.js                         # Express app setup (middleware, routes, error handling)
│   ├── config.js                      # Paths, JWT secret, port configuration
│   ├── middleware/
│   │   └── auth.middleware.js         # JWT verification middleware
│   ├── routes/
│   │   ├── auth.routes.js             # /api/auth (register, login, profile, users CRUD)
│   │   ├── menu.routes.js             # /api/menu (menu CRUD + image upload)
│   │   └── order.routes.js            # /api/orders (order CRUD + tracking)
│   ├── services/
│   │   ├── userStore.js               # Atomic JSON read/write for users.json
│   │   ├── menuStore.js               # Atomic JSON read/write for menu.json
│   │   └── orderStore.js              # Order store (JSON + optional PostgreSQL)
│   └── utils/
│       ├── httpErrors.js              # HTTP error factory function
│       └── validators.js              # Email/password validation utilities
│
├── src/                               # FRONTEND (React)
│   ├── main.jsx                       # React entry point (renders App)
│   ├── index.css                      # CSS variables & global resets
│   ├── App.jsx                        # Root component: routing + auth state
│   ├── App.css                        # All styles (~6100 lines)
│   ├── contexts/
│   │   └── AuthModalContext.jsx        # Login/register modal state
│   ├── components/
│   │   ├── TopNav.jsx                 # Main navigation bar (logo, links, sign in, cart badge)
│   │   ├── AuthOverlay.jsx            # Login form modal overlay
│   │   ├── CategoryModal.jsx          # Category item listing modal
│   │   ├── CustomizeModal.jsx         # Item customization modal (size, extras, quantity)
│   │   ├── DeliveryMap.jsx            # Leaflet map component for address picking
│   │   ├── MapPopup.jsx               # Map popup with distance calculation
│   │   └── Sidebar.jsx/Navbar.jsx     # Legacy navigation (unused)
│   ├── pages/
│   │   ├── Home.jsx                   # Landing page / hero section
│   │   ├── MenuPage.jsx               # Category grid → opens CategoryModal
│   │   ├── CartPage.jsx               # Cart review (qty, remove, clear)
│   │   ├── OrderPage.jsx              # Checkout + order placement + history
│   │   ├── TrackingPage.jsx           # Public order lookup by ID/phone
│   │   ├── ProfilePage.jsx            # User profile/dashboard (full)
│   │   ├── UserPage.jsx               # Read-only user info
│   │   ├── AdminPage.jsx              # Admin panel (menu, orders, users management)
│   │   └── Register.jsx               # Registration form modal
│   └── services/                      # API client modules
│       ├── cartService.js             # Cart CRUD in localStorage
│       ├── orderService.js            # Order API calls
│       ├── menuService.js             # Menu API calls
│       └── authService.js             # Auth API calls (delete account)
│
├── data/                              # JSON data files
│   ├── users.json                     # User accounts (hashed passwords)
│   ├── menu.json                      # Menu items
│   └── orders.json                    # Order records
│
└── public/                            # Static assets
    └── images/                        # Food images by category
```

---

## 4. COMPLETE FILE-BY-FILE BREAKDOWN

### 4.1 BACKEND FILES

---

#### `server/index.js`
**Purpose:** Entry point. Starts the Express server.

```js
import app from './app.js'
import { port } from './config.js'
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`)
})
```
**Why it matters:** Simply imports app and starts listening on port 3001 (or `PORT` env var).

---

#### `server/app.js`
**Purpose:** Express app configuration. Sets up CORS, JSON parsing, static file serving, routes, and error handling.

**Key lines to cite:**
- **Line 12-16** — CORS config: allows `http://localhost:5173` (Vite dev server)
- **Line 17** — `express.json()` for parsing JSON request bodies
- **Line 19** — Serves `/images` static files from `public/images/`
- **Line 21-23** — Health check endpoint `GET /api/health`
- **Line 25-27** — Route mounting:
  - `/api/auth` → `authRoutes`
  - `/api/menu` → `menuRoutes`
  - `/api/orders` → `orderRoutes`
- **Line 29-31** — 404 catch-all for unmatched routes
- **Line 33-41** — Global error handler; handles `INVALID_USERS_JSON` and `INVALID_MENU_JSON` errors specially

**Flow:** Request arrives → CORS headers → JSON body parsed → static files checked → route matched → handler runs → error handler catches thrown errors.

---

#### `server/config.js`
**Purpose:** Centralized configuration.

**Lines to cite:**
- **Line 7-8** — `__dirname` calculation using `fileURLToPath(import.meta.url)` (ESM equivalent of `__dirname`)
- **Line 10** — `rootDir` = project root (resolved from `server/` one level up)
- **Line 11** — `usersFilePath` = `rootDir/data/users.json`
- **Line 12** — `menuFilePath` = `rootDir/data/menu.json`
- **Line 13** — `jwtSecret` from env or fallback `'dev-only-jwt-secret-change-me'`
- **Line 14** — `jwtExpiresIn` from env or fallback `'1h'`
- **Line 15** — `port` from env or fallback `3001`

**Why it matters:** All file paths, JWT config, and port are defined here. If you change file locations, update paths here.

---

#### `server/middleware/auth.middleware.js`
**Purpose:** JWT authentication middleware. Protects routes that require authentication.

**Flow:**
1. Extract `Authorization` header
2. Split into scheme + token (expects `Bearer <token>`)
3. If no token or wrong scheme → 401
4. Verify token with `jwt.verify(token, jwtSecret)`
5. If valid → attach `req.user = { id, email, role }` → call `next()`
6. If invalid/expired → 401

**Key lines:**
- **Line 10** — `authorization.split(' ')` to get scheme and token
- **Line 12** — Checks for `Bearer` scheme
- **Line 17** — `jwt.verify(token, jwtSecret)` — decodes and validates
- **Line 18** — Sets `req.user` with payload data: `id` (from `sub`), `email`, `role`

**Usage pattern:** `router.get('/profile', requireAuth, handler)` — `requireAuth` runs before the handler.

---

#### `server/routes/auth.routes.js`
**Purpose:** All authentication endpoints.

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Create account |
| POST | `/login` | No | Sign in, returns JWT |
| GET | `/profile` | JWT | Get current user |
| PUT | `/profile` | JWT | Update name, phone, address |
| DELETE | `/profile` | JWT | Soft delete (5-day grace) |
| POST | `/profile/restore` | JWT | Cancel deletion |
| GET | `/users` | Admin | List all users |
| DELETE | `/users/:id` | Admin | Force delete user |
| POST | `/users/:id/restore` | Admin | Restore deleted user |

**Key helper functions:**

1. **`withoutPassword(user)`** (line 18) — Strips `password` hash from user object before sending to client. Used on ALL user responses.

2. **`withoutPasswordAdmin(user)`** (line 33) — Same as above but also includes `deletedAt` for admin views.

3. **`issueToken(user)`** (line 40) — Signs a JWT with payload `{ email, role }`, subject = `user.id`, expires in `jwtExpiresIn`.

4. **`purgeExpiredAccounts()`** (line 47) — Background cleanup. Runs once at startup + every 24 hours. Removes accounts where `scheduledDeletionAt` has passed.

**Registration flow (`POST /register`):**
1. Validate email + password (required, format, length ≥ 8)
2. Check for duplicate email → 409 if exists
3. Hash password with bcrypt (10 salt rounds)
4. Check `adminCode === ADMIN_SECRET` → role = `admin` or `customer`
5. Create user with uuid, save to `users.json`
6. Return user (without password) with 201

**Login flow (`POST /login`):**
1. Find user by email in `users.json`
2. If user is past their scheduled deletion → permanently remove, return 401
3. Compare password with bcrypt
4. If match → return JWT token + user object
5. Frontend stores token in `localStorage`

**Profile update (`PUT /profile`):**
1. Find user by `req.user.id` (from JWT)
2. Update `firstName`, `lastName`, `phone`, `address`
3. Save and return updated user

**Soft delete (`DELETE /profile`):**
1. Set `isDeleted: true`, `deletedAt: now`, `scheduledDeletionAt: now + 5 days`
2. User can restore within 5 days
3. After 5 days, `purgeExpiredAccounts()` permanently removes them

**Admin user management (`GET /users`, `DELETE /users/:id`, `POST /users/:id/restore`):**
- All check `req.user.role !== 'admin'` → 403
- Admin cannot delete other admin accounts
- Admin can force-delete (immediate removal) or restore a user's pending deletion

---

#### `server/routes/menu.routes.js`
**Purpose:** Menu item CRUD + image upload.

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | List items (optional `?category=` filter) |
| GET | `/:id` | No | Get single item |
| POST | `/` | Admin | Add new item |
| POST | `/upload` | Admin | Upload item image |
| PUT | `/:id` | Admin | Update item |
| DELETE | `/:id` | Admin | Delete item |

**Image upload (`POST /upload`):**
- Uses multer with lazy initialization (loaded only when first called)
- Stores images in `public/images/{category}/`
- Filename: `{sanitized_name}_{timestamp}.{ext}`
- Returns path like `/images/pizza/Pepperoni_1700000000.jpg`

**GET `/` with category filter (line 51-61):**
- Reads all menu items
- If `req.query.category` is provided, filters by category
- Returns filtered or full list

**POST `/` (line 78-103) — Add item:**
- Requires `name`, `category`, `price`
- Generates UUID for id
- Saves to menu.json

**PUT `/:id` (line 106-130) — Update item:**
- Spreads existing item, then conditionally overwrites fields
- Special handling: `unavailable` boolean for stock management

**DELETE `/:id` (line 133-145):**
- Splice removes from array
- Saves updated menu.json

**Important detail:** The `confirmDelete` function in AdminPage actually TOGGLES `unavailable` rather than deleting. True deletion is only via the API directly or when the admin explicitly deletes in the orders/users sections.

---

#### `server/routes/order.routes.js`
**Purpose:** Order CRUD + public tracking.

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | JWT | Get orders (admin: all; user: own) |
| GET | `/track?q=` | No | Public tracking by ID or phone |
| GET | `/:id` | No | Get single order by ID |
| POST | `/` | JWT | Place new order |
| PUT | `/:id/status` | Admin | Update order status |
| DELETE | `/:id` | Admin | Delete order |

**GET `/` (line 12-17):**
- Admin → returns all orders
- Regular user → returns only orders where `userId === req.user.id`

**GET `/track?q=` (line 20-26):**
- Public, no auth required
- Searches by order ID OR phone number (via `findOrderByQuery`)

**POST `/` (line 38-55) — Place order:**
- Validates: items not empty, phone required, address required for delivery
- Generates order ID format: `FH-{last 7 digits of timestamp}-{random 2 digits}`
- Example: `FH-8496943-12`
- Status starts at `Pending`
- Saves via `createOrder` (JSON or PostgreSQL)

**PUT `/:id/status` (line 58-67):**
- Admin only
- If status = 'Cancelled', also sets `cancelledAt` timestamp + optional `cancelReason`

---

#### `server/services/userStore.js`
**Purpose:** Atomic read/write operations for `users.json`.

**Key pattern — Atomic writes (line 49-53):**
```js
async function writeUsersUnsafe(users) {
  const nextJson = `${JSON.stringify(users, null, 2)}\n`
  const tempPath = `${usersFilePath}.tmp`
  await fs.writeFile(tempPath, nextJson, 'utf8')
  await fs.rename(tempPath, usersFilePath)
}
```
Writes to a `.tmp` file first, then renames. This prevents data corruption if the write is interrupted.

**Write queue (line 56-62):**
```js
writeQueue = writeQueue.then(
  () => writeUsersUnsafe(users),
  () => writeUsersUnsafe(users),
)
```
Chains writes sequentially to prevent race conditions (two simultaneous writes corrupting the file).

**`ensureUsersFile()` (line 21-31):** Creates `data/users.json` with `[]` if it doesn't exist.

**`parseUsersFile()` (line 11-18):** JSON parses and validates it's an array. Throws `INVALID_USERS_JSON` error on syntax error.

---

#### `server/services/menuStore.js`
**Purpose:** Atomic read/write for `menu.json`. Identical pattern to userStore.

Same atomic write pattern: temp file + rename + write queue.

---

#### `server/services/orderStore.js`
**Purpose:** Order storage with dual backend: JSON file (default) or PostgreSQL (optional).

**Dual storage pattern:**
- If `DATABASE_URL` env var is set → uses PostgreSQL with `pg` package
- Otherwise → reads/writes `orders.json`

**PostgreSQL table schema:**
```sql
CREATE TABLE IF NOT EXISTS fh_orders (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  placed_at TIMESTAMPTZ DEFAULT NOW()
)
```
Orders are stored as JSON blobs in the `data` column.

**Key functions:**
- `getAllOrders()` — Returns all orders (DB query or JSON read)
- `getOrderById(id)` — Filters by ID
- `findOrderByQuery(q)` — Searches by ID or phone (lowercase normalized)
- `createOrder(order)` — Saves new order
- `updateOrder(id, updates)` — Merges updates into existing order
- `removeOrder(id)` — Deletes order

**Lazy DB connection (line 21-37):**
```js
async function db() {
  if (pool !== null) return pool
  // ... connect to PostgreSQL, create table if not exists
}
```
Only connects when first order operation is called. If PostgreSQL is unavailable, falls back to JSON files.

---

#### `server/utils/httpErrors.js`
**Purpose:** Factory for HTTP error objects.

```js
export function createHttpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}
```
Adds a `status` property to Error objects. Caught by Express error handler in `app.js` which reads `error.status`.

---

#### `server/utils/validators.js`
**Purpose:** Email and password validation utilities.

```js
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const minimumPasswordLength = 8
```
- `validateEmail(email)` — Regex test
- `validatePassword(password)` — Length check (≥ 8)
- `normalizeEmail(email)` — Trims + lowercases

---

### 4.2 FRONTEND FILES

---

#### `vite.config.js`
**Purpose:** Vite configuration with dev proxy.

**Key config:** Lines 7-16
```js
proxy: {
  '/api': { target: 'http://localhost:3001', changeOrigin: true },
  '/images': { target: 'http://localhost:3001', changeOrigin: true },
}
```
During development, when the frontend (port 5173) makes requests to `/api/*` or `/images/*`, Vite forwards them to the Express backend (port 3001). This avoids CORS issues in development.

**Production:** The frontend would need to be built (`npm run build`) and served by the Express server or another server.

---

#### `src/main.jsx`
**Purpose:** React entry point. Renders `<App />` into the DOM.

---

#### `src/App.jsx`
**Purpose:** Root component. Manages auth state, defines all routes.

**Key states:**
1. **`isCheckingAuth` (line 63)** — While checking session on mount, shows "Loading your session..."
2. **`isAuthenticated` (line 62)** — Tracks whether user is logged in
3. **`verifySession(token)`** (line 66-99) — Validates token by calling `GET /api/auth/profile`. Syncs localStorage + state.

**Route protection:**
1. **`ProtectedRoute`** (line 14-34) — Checks `isAuthenticated`, redirects to `/login` if not. If `requireAdmin`, checks role.
2. **`PublicOnlyRoute`** (line 36-42) — Redirects authenticated users away from login/register.
3. **`LoginBookmarkRoute`** (line 44-59) — Opens auth modal programmatically when navigating to `/login` or `/register`.

**Route table (lines 162-229):**

| Path | Component | Guard |
|------|-----------|-------|
| `/` | Home | None |
| `/menu` | MenuPage | None |
| `/cart` | CartPage | None |
| `/login` | LoginBookmarkRoute | PublicOnlyRoute |
| `/register` | LoginBookmarkRoute (register mode) | PublicOnlyRoute |
| `/dashboard` | ProfilePage | ProtectedRoute |
| `/users` | ProfilePage | ProtectedRoute |
| `/orders` | OrderPage | ProtectedRoute |
| `/tracking` | TrackingPage | ProtectedRoute |
| `/admin` | AdminPage | ProtectedRoute + requireAdmin |
| `/profile` | UserPage | ProtectedRoute |

**Cross-tab sync (lines 111-144):**
- Listens for `auth-changed` custom event (dispatched by login/register/logout)
- Listens for `storage` event (localStorage changes from other tabs)
- Both trigger `verifySession()` to revalidate auth state

---

#### `src/contexts/AuthModalContext.jsx`
**Purpose:** React context for controlling the auth modal from anywhere in the app.

**Provides:**
- `openAuth(opts)` — Opens modal. `opts.nextPath` = redirect after login. `opts.mode` = `'login'` or `'register'`
- `closeAuth()` — Closes modal

**Usage:** Any component can call `const { openAuth } = useAuthModal()` to open the login modal.

---

#### `src/components/TopNav.jsx`
**Purpose:** Main navigation bar. Shows logo, nav links, sign-in button or user greeting, cart badge.

**Key behaviors:**
- Reads `auth_user` from localStorage to show greeting (first name or email prefix)
- Cart count updates via `cart-updated` event listener
- Admin users see an extra "Admin" nav link (line 67-71)
- "Sign In" button uses `openAuth()` from context
- Cart badge shows item count (red circle)

---

#### `src/components/AuthOverlay.jsx`
**Purpose:** Login form modal.

**Key function: `login()`** (line 42-89):
1. Validates email + password present
2. Saves email if "Remember me" checked (localStorage `fh_remember_email`)
3. Calls `POST /api/auth/login`
4. On success: stores token + user in localStorage, dispatches `auth-changed` event
5. Redirects admin to `/admin`, others to `nextPath`
6. On failure: shows error message

**States:**
- Form inputs: email, password
- Remember me checkbox
- Show/hide password toggle
- Loading state (`isSubmitting`)
- Error state (`errorMessage`)
- "Create One" button switches to RegisterModal

---

#### `src/pages/Register.jsx`
**Purpose:** Registration form modal.

**Key function: `register()`** (line 93-163):
1. Validates: all required fields, email match, password match
2. Calls `POST /api/auth/register`
3. On success: auto-login via `POST /api/auth/login`
4. Stores token + user in localStorage
5. Dispatches `auth-changed` event
6. Redirects based on role

**Admin registration:**
- Checkbox "I am registering as an administrator"
- If checked, shows admin code input
- Code compared against `ADMIN_SECRET` env var (default `'admin123'`)
- Matching code → role = `admin`, otherwise `customer`

---

#### `src/pages/Home.jsx`
**Purpose:** Landing page with hero section, category previews, CTA buttons.

**Key functions:**
- `startOrder(serviceType)` (line 7-10) — Stores service type in localStorage, navigates to `/menu`

**States:** Static content, no loading states needed.

---

#### `src/pages/MenuPage.jsx`
**Purpose:** Category grid. Displays all food categories as clickable cards.

**Key behaviors:**
1. Calls `initMenu()` on mount (legacy, no-op)
2. Listen for `cart-updated` events to update cart badge count
3. Clicking a category → opens `CategoryModal` with that category's items
4. Sidebar shows: checkout button, order settings (location, service type, store)

**States:**
- `ready` (line 20) — Controls loading spinner before showing grid
- `selectedCategory` (line 21) — Controls CategoryModal visibility
- `cartCount` (line 22) — Badge count

---

#### `src/components/CategoryModal.jsx`
**Purpose:** Modal showing items in a selected category. Each item opens `CustomizeModal`.

---

#### `src/components/CustomizeModal.jsx`
**Purpose:** Item customization (size, quantity, note). "Add to Cart" button calls `cartService.addToCart()`.

---

#### `src/pages/CartPage.jsx`
**Purpose:** Cart review page. Shows all cart items with quantity controls.

**Key behaviors:**
- Listens for `cart-updated` events to re-render
- Quantity + / - buttons call `updateCartQty()`
- Remove button calls `removeFromCart()`
- Clear all button calls `clearCart()`
- "Continue Checkout" → navigates to `/orders`
- Empty state → shows "Your cart is empty" + "Browse Menu" button

**States:**
- `cart` (line 8) — Array of cart items from localStorage
- Cart empty vs items present
- Total calculation via `getCartTotal()`

---

#### `src/pages/OrderPage.jsx`
**Purpose:** Checkout form + order placement + order history.

**Key function: `handlePlaceOrder()`** (line 103-125):
1. Validates: cart not empty, address for delivery, phone required
2. Calls `saveOrder()` from orderService
3. Saves order to backend, clears cart
4. Shows confirmation modal

**Key function: `geocodeAddress(query)`** (line 53-91):
1. Calls Nominatim API (OpenStreetMap geocoding)
2. Sets destination lat/lng + display name
3. Debounced with 700ms timeout (line 93-101)

**Form sections:**
- Service type: Delivery / Pick Up radio buttons
- Branch: hardcoded to "Puso Village, Cebu City, PH"
- Delivery address: textarea + DeliveryMap component
- Phone: auto-filled from user profile, editable
- Order summary sidebar
- Order history: list of past orders with cancel/track actions

**Order history (line 151-210):**
- Loaded via `getAllOrders()` on mount
- Each order shows: ID, status, items, total, date
- Cancellable orders show "Cancel" button → reason input → confirm
- "Track" button navigates to `/tracking`

**Confirmation modal (line 405-473):**
- Shows order details after placement
- "Track Order" and "Back to Menu" buttons

---

#### `src/pages/TrackingPage.jsx`
**Purpose:** Public order tracking by order number or phone.

**Key function: `handleSearch()`** (line 12-19):
1. Calls `findOrder(query)` from orderService
2. If found → displays order details
3. If not found → "No order found" message

**States:**
- `query` (line 8) — Search input
- `order` (line 9) — Found order (null if not found/not searched)
- `message` (line 10) — Status message ("Order found" / "No order found")

---

#### `src/pages/AdminPage.jsx`
**Purpose:** Full admin panel. Four views: Menu Management, Orders, User Accounts.

**Views (controlled by `view` state, line 142):**
- `list` → Menu items table with search/filter
- `add` → Add item form
- `edit` → Edit item form
- `delete` → Unavailable confirmation modal
- `orders` → Orders table with status dropdown
- `users` → Users table with restore/force-delete

**Key functions:**
- `reload()` (line 154-164) — Fetches menu items from API
- `handleAdd()` (line 187-199) — Validates + creates menu item
- `openEdit(item)` (line 201-205) — Opens edit form pre-filled
- `handleEdit()` (line 207-219) — Updates menu item
- `openDelete(item)` (line 221-224) — Opens unavailable toggle modal
- `confirmDelete()` (line 226-242) — Toggles `unavailable` flag (NOT actual deletion)
- `ImageUpload` component (line 11-78) — Drag-and-drop image upload via multer

**Order management (line 395-472):**
- Status dropdown changes trigger `updateOrderStatus()`
- Delete button with confirmation dialog
- Cancel reason shown for cancelled orders

**User management (line 475-563):**
- Lists all users with status badges
- Restore button for users pending deletion
- Force Delete button for non-admin users

---

#### `src/services/cartService.js`
**Purpose:** Cart CRUD in localStorage.

**Key functions:**

| Function | Description |
|----------|-------------|
| `getCart()` | Read cart from `localStorage('fh_cart_items')` |
| `addToCart(item, qty)` | Add item or increment quantity |
| `removeFromCart(id)` | Remove item by ID |
| `updateCartQty(id, qty)` | Update quantity (removes if ≤ 0) |
| `clearCart()` | Empty entire cart |
| `getCartCount()` | Total item count across all entries |
| `getCartTotal()` | Sum of (price × quantity) for all items |

**Cart item ID format:** `{original_id}_{size_option}` — e.g., `pizza_2_Regular`

**Persistence:** Cart survives page refreshes and browser sessions (stored in localStorage).

**Event:** All mutating functions dispatch `cart-updated` event for cross-component sync.

---

#### `src/services/orderService.js`
**Purpose:** API client for order endpoints.

**Key functions:**

| Function | API Call | Description |
|----------|----------|-------------|
| `getAllOrders()` | `GET /api/orders` | Fetch orders |
| `findOrder(q)` | `GET /api/orders/track?q=` | Public order lookup |
| `saveOrder(order)` | `POST /api/orders` | Place order + clear cart |
| `deleteOrder(id)` | `DELETE /api/orders/:id` | Admin delete order |
| `updateOrderStatus(id, status, reason)` | `PUT /api/orders/:id/status` | Admin update status |
| `canCancel(status)` | (client-side) | Check if status is cancellable |

**Cancellable statuses:** `['Pending', 'Preparing', 'Out for delivery', 'Ready for pickup']`

**saveOrder() flow:**
1. Gets cart items + total from cartService
2. POSTs to backend with service details
3. Saves response to `localStorage('fh_last_order')`
4. Clears cart via `clearCart()`
5. Dispatches `cart-updated` event

---

#### `src/services/menuService.js`
**Purpose:** API client for menu endpoints.

**Key functions:**

| Function | API Call | Description |
|----------|----------|-------------|
| `getMenuItems()` | `GET /api/menu` | Get all items |
| `getItemsByCategory(category)` | `GET /api/menu?category=` | Filter by category |
| `addMenuItem(item)` | `POST /api/menu` | Admin: add item |
| `updateMenuItem(id, updates)` | `PUT /api/menu/:id` | Admin: update item |
| `deleteMenuItem(id)` | `DELETE /api/menu/:id` | Admin: delete item |
| `initMenu()` | No-op | Legacy placeholder |

---

#### `src/services/authService.js`
**Purpose:** API client for auth endpoints.

**Key function:**
- `deleteUser(token)` — Calls `DELETE /api/auth/profile` for soft delete

---

### 4.3 DATA FILES

#### `data/users.json`
Array of user objects:
```json
{
  "id": "uuid-v4",
  "email": "user@example.com",
  "password": "$2b$10$...hash...",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "09171234567",
  "address": "Cebu City",
  "role": "customer",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "isDeleted": false,
  "deletedAt": null,
  "scheduledDeletionAt": null
}
```

#### `data/menu.json`
Array of menu item objects:
```json
{
  "id": "pizza_1",
  "name": "Pepperoni Pizza",
  "category": "Pizza",
  "subcategory": "Classic",
  "description": "Classic pepperoni with mozzarella cheese",
  "price": 299,
  "image": "/images/pizza/Pepperoni.jpg",
  "unavailable": false
}
```

#### `data/orders.json`
Array of order objects:
```json
{
  "id": "FH-8496943-12",
  "userId": "uuid-v4",
  "status": "Pending",
  "placedAt": "2025-01-01T00:00:00.000Z",
  "items": [{ "id": "pizza_1", "name": "Pepperoni", "quantity": 2, "price": 299 }],
  "total": 598,
  "serviceType": "Delivery",
  "address": "Cebu City",
  "phone": "09171234567",
  "branch": { "id": "puso-village", "name": "Puso Village, Cebu City, PH", "lat": 10.2913456, "lng": 123.9016386 },
  "destination": { "lat": 10.3, "lng": 123.9, "name": "Cebu City" },
  "cancelledAt": null,
  "cancelReason": null
}
```

---

## 5. HOW PATHS WORK

### 5.1 File Paths (Backend)

All paths are resolved in **`server/config.js`**:

```
rootDir = path.resolve(__dirname, '..')
         = /path/to/forkhub/      (project root)

usersFilePath = rootDir/data/users.json
menuFilePath  = rootDir/data/menu.json
```

**Image storage path:** `rootDir/public/images/{category}/{filename}`

The Express app serves `/images` as a static directory pointing to `rootDir/public/images/`.

### 5.2 URL Paths (Frontend Routing)

All routing defined in **`src/App.jsx:162-229`** using React Router DOM.

**Passing state via navigation:**
```js
navigate('/login', { state: { nextPath: '/orders' } })
```
This is used so after login, the user goes back to where they were.

### 5.3 API Paths (Backend Routing)

All API routes are mounted in **`server/app.js:25-27`**:

```
/api/auth/*    → auth.routes.js
/api/menu/*    → menu.routes.js
/api/orders/*  → order.routes.js
/images/*      → Static files (public/images/)
```

**Proxy bridge (dev only):** In `vite.config.js`, both `/api` and `/images` are proxied to `localhost:3001`. This means during development, `fetch('/api/menu')` works from the frontend as if it's same-origin.

**In production:** You'd build the React app and serve it from Express, or use a reverse proxy.

### 5.4 Cart localStorage Path

Cart items stored in browser under key `fh_cart_items` in localStorage.

### 5.5 Order ID Format

Orders placed generate IDs like: `FH-8496943-12`
- `FH` → Prefix stands for "ForkHub"
- `8496943` → Last 7 digits of `Date.now()`
- `12` → Random 2-digit number

---

## 6. HOW THE REQUEST/DATA FLOW WORKS

### 6.1 General Request Lifecycle

```
Browser (React)
    │
    ▼
fetch('/api/auth/login')           ← Vite proxy forwards to Express
    │
    ▼
Express server (port 3001)
    │
    ├── CORS middleware             ← Allows cross-origin from localhost:5173
    ├── JSON body parser            ← Parses req.body
    ├── Route match                 ← /api/auth/login matches auth.routes.js
    ├── requireAuth?                ← JWT verification (if needed)
    ├── Route handler               ← Runs the actual logic
    ├── Response                    ← JSON sent back
    │
    ▼
React component receives response
    │
    ├── Updates localStorage        ← Auth token, user data
    ├── Dispatches custom event     ← 'auth-changed', 'cart-updated'
    ├── Updates state               ← Re-renders component
    └── Navigates                   ← Redirects to next page
```

### 6.2 Full Request Path Examples

**Example 1: User logs in**

1. User clicks "Sign In" button in TopNav
2. `openAuth()` from AuthModalContext opens AuthOverlay
3. User fills email + password, clicks "Sign In"
4. `login()` function in AuthOverlay calls `fetch('/api/auth/login')`
5. Vite proxy → `http://localhost:3001/api/auth/login`
6. Express route handler (auth.routes.js:121):
   - Reads `users.json` → finds user by email
   - Compares password with bcrypt
   - If match: signs JWT, returns `{ token, user }`
7. Frontend:
   - Stores token in `localStorage('auth_token')`
   - Stores user in `localStorage('auth_user')`
   - Dispatches `auth-changed` custom event
   - Navigates to `/admin` (if admin) or `nextPath`
8. TopNav hears `auth-changed` → updates greeting from "Sign In" to "Hi, John"

**Example 2: User places order**

1. User is on OrderPage with items in cart
2. Selects Delivery, enters address (geocoded via Nominatim)
3. Clicks "Add to Cart" (the place order button)
4. `handlePlaceOrder()` calls `saveOrder(order)` in orderService
5. `saveOrder()`:
   - Gets cart items from `cartService.getCart()`
   - Calculates total via `cartService.getCartTotal()`
   - Calls `POST /api/orders` with { items, total, serviceType, address, phone, branch, destination }
6. Backend (order.routes.js:38):
   - Validates: items not empty, phone required, address for delivery
   - Generates order ID: `FH-8496943-12`
   - Sets status: `'Pending'`
   - Saves to orders.json (or PostgreSQL)
   - Returns the saved order
7. Frontend:
   - Saves order to `localStorage('fh_last_order')`
   - Clears cart via `clearCart()`
   - Dispatches `cart-updated` event
   - Shows confirmation modal with order details

**Example 3: Admin marks item unavailable**

1. Admin is on AdminPage, "List Items" view
2. Clicks "Unavailable" button on an item
3. `openDelete(item)` sets `deleteTarget` and switches to `delete` view
4. Confirmation modal asks "Mark as Unavailable 'Pepperoni Pizza'?"
5. User clicks "YES, MAKE UNAVAILABLE"
6. `confirmDelete()` calls `updateMenuItem(id, { unavailable: true })`
7. Backend (menu.routes.js:106): Updates item's `unavailable` field
8. Frontend reloads item list, shows toast "marked as unavailable"
9. In menu grid, item appears greyed out with `[UNAVAILABLE]` tag

---

## 7. AUTHENTICATION FLOW (DEEP DIVE)

### Registration → Auto-Login

```
Register.jsx                  AuthOverlay.jsx
    │                              │
    │  POST /api/auth/register     │  POST /api/auth/login
    │  ───────────────────────►    │  ───────────────────►
    │                              │
    ▼                              ▼
Backend validates:             Backend validates:
- email format                 - email exists
- password length ≥ 8          - bcrypt compare
- duplicate email check        - not expired deletion
- hash password (bcrypt)
- save user
    │                              │
    ◄──── 201 { user }            ◄──── 200 { token, user }
    │                              │
    │                              ▼
    │                    Frontend stores:
    │                    - auth_token (JWT)
    │                    - auth_user (JSON)
    │                    - login ('true')
    │                    Dispatches 'auth-changed'
    │                    Navigates to /admin or nextPath
    └────────────► Auto-login via same credentials
```

### Session Verification (on page load)

```
App.jsx mount
    │
    ▼
Read auth_token from localStorage
    │
    ▼
GET /api/auth/profile (with Bearer token)
    │
    ▼
Backend: auth.middleware.js verifies JWT
    │
    ├── Valid → attach req.user → return user object
    │           Frontend: sets isAuthenticated = true
    │
    └── Invalid/expired → 401
                Frontend: clears all auth localStorage
                Sets isAuthenticated = false
```

### Cross-Tab Sync

```
Tab 1: User logs in
    │
    ├── Stores auth_token, auth_user in localStorage
    ├── Dispatches 'auth-changed' custom event (same tab)
    │
    ▼
Tab 1 hears 'auth-changed' → re-verifies session

Tab 2: localStorage changed event fires
    │
    ▼
Tab 2 hears 'storage' event → calls verifySession()
    → Also logged in
```

### Account Deletion Flow

```
User requests delete (DELETE /api/auth/profile)
    │
    ▼
Backend sets:
- isDeleted = true
- deletedAt = now
- scheduledDeletionAt = now + 5 days
    │
    ▼
User can restore (POST /api/auth/profile/restore)
Removes isDeleted, deletedAt, scheduledDeletionAt
    │
    ▼
Background job (purgeExpiredAccounts) runs every 24h
Removes accounts where scheduledDeletionAt < now
```

---

## 8. ORDER PLACEMENT FLOW (DEEP DI VE)

```
Home Page → "Delivery" or "Pick Up" button
    │
    ├── Stores service type in localStorage('order_service_type')
    ▼
MenuPage → Click category → CategoryModal → Click item → CustomizeModal
    │                                                          │
    │                                          Add to Cart ────┘
    │                                          (cartService.addToCart)
    ▼
CartPage → Review items → "Continue Checkout"
    │
    ▼
OrderPage
    │
    ├── Choose Delivery/Pick Up
    ├── Enter address (DeliveryMap + Nominatim geocoding)
    ├── Enter phone
    │
    ▼
Click "Add to Cart" (place order button)
    │
    ▼
saveOrder() in orderService:
    ├── Gets cart items + total from cartService
    ├── POST /api/orders
    │
    ▼
Backend (order.routes.js POST /):
    ├── Validates: items.length > 0, phone present, address for Delivery
    ├── Generates order ID: FH-{timestamp}-{random}
    ├── Status: 'Pending'
    ├── Save to orders.json (or PostgreSQL)
    └── Returns order object
    │
    ▼
Frontend:
    ├── Saves to localStorage('fh_last_order')
    ├── clearCart() → removes localStorage('fh_cart_items')
    ├── Dispatches 'cart-updated'
    └── Shows confirmation modal
    │
    ▼
User can:
    ├── "Track Order" → TrackingPage (search by ID or phone)
    └── "Back to Menu" → MenuPage
```

---

## 9. ADMIN OPERATIONS FLOW

### Menu Management

```
AdminPage → "List Items" tab
    │
    ├── Shows table with: Image, Name, Category, Subcategory, Price, Actions
    ├── Search field (filters by name)
    ├── Category filter dropdown
    │
    ├── "Add Item" tab → Form → "ADD ITEM" → POST /api/menu
    │
    ├── "Edit" button → Pre-filled form → "SAVE CHANGES" → PUT /api/menu/:id
    │
    └── "Unavailable" button → Confirm modal
            → Toggles item.unavailable flag
            → Item shows greyed out with [UNAVAILABLE] tag
```

### Order Management

```
AdminPage → "Orders" tab
    │
    ├── Fetches all orders via getAllOrders()
    ├── Shows table with: Order #, Status, Service, Address, Phone, Items, Total, Date
    │
    ├── Status dropdown → change status
    │   ├── Pending → Preparing → Out for delivery / Ready for pickup → Delivered → Completed
    │   └── Cancelled (with reason)
    │
    └── "Delete" button → Removes order
```

### User Management

```
AdminPage → "User Accounts" tab
    │
    ├── Fetches all users via GET /api/auth/users
    ├── Shows: Name, Email, Role, Joined, Status, Deletion Date
    │
    ├── "Restore" button (for pending deletion users)
    │   → POST /api/auth/users/:id/restore
    │
    └── "Force Delete" button (non-admin users only)
        → DELETE /api/auth/users/:id
```

---

## 10. DATA MODELS & FILE STORAGE

### No True Database

The application uses **JSON files** as its primary data store. Files are in `data/`:
- `users.json` — User accounts
- `menu.json` — Menu items  
- `orders.json` — Order records

### Why JSON Files?

The project is designed to:
1. Run out of the box with no database setup
2. Be simple enough for a school project
3. Optionally support PostgreSQL for orders when configured

### Atomic Writes

Both `userStore.js` and `menuStore.js` use a **temp-file-rename** pattern:
1. Write to `file.json.tmp`
2. Rename `.tmp` → `file.json`

This prevents data corruption if the process crashes mid-write.

### Write Queue

Both stores chain writes via a promise queue:
```js
writeQueue = writeQueue.then(() => writeUnsafe(data))
```
This prevents race conditions from concurrent writes.

### JSON Validation

Both stores:
1. Check if file exists, create with `[]` if not
2. Parse JSON, verify it's an array
3. On syntax error, throw specific error code (`INVALID_USERS_JSON`, `INVALID_MENU_JSON`)
4. These are caught by the global error handler in `app.js` and return 500

---

## 11. KEY FUNCTION MAP

### Backend

| File | Function | Line | What it does |
|------|----------|------|-------------|
| `app.js` | CORS setup | 12-16 | Allows requests from Vite dev server |
| `app.js` | Static `/images` | 19 | Serves food images |
| `app.js` | Route mounting | 25-27 | Mounts auth/menu/order routes |
| `app.js` | Global error handler | 33-41 | Catches all errors, returns JSON |
| `config.js` | `rootDir` | 10 | Resolves project root path |
| `config.js` | `jwtSecret` | 13 | JWT signing key |
| `auth.middleware.js` | `requireAuth` | 4-23 | JWT verification middleware |
| `auth.routes.js` | `withoutPassword` | 18-31 | Strips password from user object |
| `auth.routes.js` | `issueToken` | 40-45 | Creates signed JWT |
| `auth.routes.js` | `purgeExpiredAccounts` | 47-60 | Background cleanup of expired accounts |
| `auth.routes.js` | `POST /register` | 65-119 | Register new user |
| `auth.routes.js` | `POST /login` | 121-160 | Login, returns JWT |
| `auth.routes.js` | `DELETE /profile` | 208-231 | Soft delete with 5-day grace |
| `auth.routes.js` | `POST /profile/restore` | 233-244 | Cancel deletion |
| `auth.routes.js` | `GET /users` | 246-252 | Admin: list all users |
| `auth.routes.js` | `DELETE /users/:id` | 254-264 | Admin: force delete |
| `menu.routes.js` | `GET /` (with `?category=`) | 51-62 | List/filter menu items |
| `menu.routes.js` | `POST /` (add item) | 78-103 | Admin: add menu item |
| `menu.routes.js` | `POST /upload` | 38-48 | Upload food image via multer |
| `menu.routes.js` | `PUT /:id` | 106-130 | Admin: update item |
| `menu.routes.js` | `DELETE /:id` | 133-145 | Admin: delete item |
| `order.routes.js` | `GET /` | 12-17 | Get orders (admin: all, user: own) |
| `order.routes.js` | `GET /track` | 20-26 | Public order lookup by ID/phone |
| `order.routes.js` | `POST /` | 38-55 | Place new order |
| `order.routes.js` | `PUT /:id/status` | 58-67 | Admin: update status |
| `userStore.js` | `readUsers` | 33-47 | Atomic read users.json |
| `userStore.js` | `writeUsers` | 56-62 | Atomic write with queue |
| `menuStore.js` | `readMenu` / `writeMenu` | 28-57 | Atomic menu file operations |
| `orderStore.js` | `db()` | 21-38 | Lazy PostgreSQL connection |
| `orderStore.js` | `getAllOrders` | 40-44 | Get all orders (DB or JSON) |
| `orderStore.js` | `findOrderByQuery` | 46-51 | Search by ID or phone |
| `orderStore.js` | `createOrder` | 52-56 | Save new order |
| `orderStore.js` | `updateOrder` | 57-68 | Update order status |
| `httpErrors.js` | `createHttpError` | 1-5 | HTTP error factory |
| `validators.js` | `validateEmail` / `validatePassword` | 4-10 | Input validation |

### Frontend

| File | Function | Line | What it does |
|------|----------|------|-------------|
| `App.jsx` | `verifySession` | 66-99 | Validates JWT on app mount |
| `App.jsx` | `ProtectedRoute` | 14-34 | Route guard component |
| `App.jsx` | `PublicOnlyRoute` | 36-42 | Redirects authed users away from login |
| `App.jsx` | `LoginBookmarkRoute` | 44-59 | Opens auth modal on route enter |
| `App.jsx` | Auth sync listeners | 111-144 | Cross-tab auth sync |
| `AuthModalContext.jsx` | `openAuth` | 12-18 | Opens auth modal |
| `AuthModalContext.jsx` | `closeAuth` | 20-23 | Closes auth modal |
| `TopNav.jsx` | User sync + greeting | 13-35 | Reads auth state, shows greeting |
| `TopNav.jsx` | Cart badge | 37-41 | Shows cart item count |
| `AuthOverlay.jsx` | `login()` | 42-89 | Login form submission |
| `Register.jsx` | `register()` | 93-163 | Registration + auto-login |
| `Home.jsx` | `startOrder()` | 7-10 | Sets service type, navigates to menu |
| `MenuPage.jsx` | Category grid + modal | 18-128 | Browse categories |
| `CartPage.jsx` | Cart display + qty control | 6-114 | Review/manage cart |
| `OrderPage.jsx` | `handlePlaceOrder()` | 103-125 | Submit order to backend |
| `OrderPage.jsx` | `geocodeAddress()` | 53-91 | Nominatim address lookup |
| `OrderPage.jsx` | Order history + cancel | 151-210 | Past orders management |
| `TrackingPage.jsx` | `handleSearch()` | 12-19 | Lookup order by ID/phone |
| `AdminPage.jsx` | `reload()` | 154-164 | Fetch menu items |
| `AdminPage.jsx` | `handleAdd()` | 187-199 | Add menu item form |
| `AdminPage.jsx` | `confirmDelete()` | 226-242 | Toggle unavailable flag |
| `AdminPage.jsx` | `ImageUpload` component | 11-78 | Drag-drop image upload |
| `AdminPage.jsx` | Order management | 395-472 | Status updates, deletion |
| `AdminPage.jsx` | User management | 475-563 | Restore/force delete |
| `cartService.js` | `addToCart()` / `removeFromCart()` | 11-27 | Cart item CRUD |
| `cartService.js` | `getCartCount()` / `getCartTotal()` | 47-53 | Cart calculations |
| `orderService.js` | `saveOrder()` | 35-42 | Place order + clear cart |
| `orderService.js` | `canCancel()` | 58-59 | Check cancellable status |
| `menuService.js` | `getMenuItems()` / `addMenuItem()` | 20-34 | Menu API calls |
| `authService.js` | `deleteUser()` | 5-20 | Account deletion API |

---

## 12. POTENTIAL DEFENSE Q&A

### General Architecture

**Q: What framework did you use and why?**
**A:** We used React 19 for the frontend with Vite 8 as the build tool, and Express 5 for the backend. React was chosen for its component-based architecture which makes the UI modular and reusable. Vite provides fast development with hot module replacement. Express is lightweight and perfect for building REST APIs quickly.

**Q: Why did you choose JSON files instead of a database?**
**A:** JSON files were chosen to make the project runnable without any database setup. This simplifies deployment and testing. However, we designed the order store with a pluggable architecture—when a `DATABASE_URL` environment variable is set, it automatically switches to PostgreSQL. The file operations use atomic writes (temp-file-rename pattern) to prevent data corruption.

**Q: How is the project structured?**
**A:** The project follows a clear separation of concerns:
- `server/` — Express backend with routes, services, middleware, and utilities
- `src/` — React frontend with pages, components, contexts, and services
- `data/` — JSON data files
- `public/` — Static assets (images)

### Authentication

**Q: How does authentication work?**
**A:** We use JWT (JSON Web Token) for authentication. When a user logs in, the server validates their credentials against bcrypt-hashed passwords in `users.json`. If valid, it signs a JWT containing the user's email and role, with a 1-hour expiry. The frontend stores this token in localStorage and sends it via the `Authorization: Bearer` header on subsequent requests. The `requireAuth` middleware in `auth.middleware.js` verifies this token on protected routes.

**Q: How are passwords stored?**
**A:** Passwords are hashed using bcrypt with 10 salt rounds (line 95 of `auth.routes.js`). We never store plain-text passwords. The `withoutPassword()` function ensures the password hash is never sent to the client in API responses.

**Q: How did you handle user roles?**
**A:** There are two roles: `customer` (default) and `admin`. Users become admin by entering a secret code (`ADMIN_SECRET`, default `'admin123'`) during registration. Admin routes check `req.user.role !== 'admin'` and return 403 if the user isn't an admin. The `ProtectedRoute` component on the frontend also checks `auth_user.role === 'admin'` for admin-only pages.

**Q: How does the "remember me" feature work?**
**A:** On the login form, if "Remember me" is checked, the email is saved to `localStorage('fh_remember_email')`. On subsequent visits to the login page, the email is pre-filled. The actual authentication still requires the password—this is just a convenience for email entry.

**Q: How does account deletion work?**
**A:** We implemented a soft-delete with a 5-day grace period. When a user requests deletion:
1. The account is marked `isDeleted: true`
2. A `scheduledDeletionAt` timestamp is set 5 days in the future
3. The user can restore their account within those 5 days
4. A background job (`purgeExpiredAccounts`) runs every 24 hours to permanently remove expired accounts
5. Admins can force-delete (immediate removal) or restore any user

### Menu & Cart

**Q: How is the menu loaded and filtered?**
**A:** Menu items are fetched from `GET /api/menu`. The backend reads from `menu.json` and optionally filters by category using the `?category=` query parameter. On the frontend, categories are displayed as a grid of cards. Clicking a category opens a modal that fetches items filtered by that category via `getItemsByCategory()`.

**Q: How does the cart work?**
**A:** The cart is stored entirely in the browser's localStorage under the key `fh_cart_items`. This means the cart persists even if the user refreshes the page or closes and reopens the browser. The `cartService.js` module provides functions to add, remove, update quantity, clear, count, and total the cart. All mutating functions dispatch a `cart-updated` custom event to keep all components in sync.

**Q: How does the "unavailable" feature work for menu items?**
**A:** Menu items have an `unavailable` boolean field. When an admin toggles this, the item appears greyed out with a `[UNAVAILABLE]` tag in the admin panel. However, the current frontend doesn't filter out unavailable items from the customer-facing menu—this would be an enhancement. The toggle is done via `PUT /api/menu/:id` with `{ unavailable: Boolean }`.

### Orders

**Q: How are orders placed?**
**A:** The order placement flow is: items are added to cart → user goes to OrderPage → selects Delivery or Pick Up → enters address (geocoded via Nominatim/OpenStreetMap) → enters phone → clicks "Add to Cart" button → the frontend calls `orderService.saveOrder()` which sends `POST /api/orders` with cart items, total, and service details → the backend generates an order ID (`FH-{timestamp}-{random}`) with status "Pending" → saves to orders.json (or PostgreSQL) → returns the order → frontend clears the cart and shows a confirmation modal.

**Q: How does order tracking work?**
**A:** Anyone (no auth required) can track an order by going to the Tracking page and entering the order ID (e.g., `FH-8496943-12`) or their phone number. The backend searches `orders.json` using `findOrderByQuery()`, which normalizes the query to lowercase and matches against either the order ID or the phone field.

**Q: What order statuses are available?**
**A:** The status flow is: `Pending` → `Preparing` → `Out for delivery` or `Ready for pickup` → `Delivered` → `Completed`. Orders can also be set to `Cancelled` with an optional reason. Only orders with statuses `Pending`, `Preparing`, `Out for delivery`, or `Ready for pickup` can be cancelled (checked by the `canCancel()` function).

**Q: Can orders be cancelled?**
**A:** Yes, but only by the customer and only if the status is one of the cancellable statuses: `Pending`, `Preparing`, `Out for delivery`, or `Ready for pickup`. The customer can provide a reason for cancellation. Once confirmed, the status is updated to `Cancelled` with a timestamp and reason.

### Frontend

**Q: How does routing work on the frontend?**
**A:** We use React Router DOM v7 for client-side routing. All routes are defined in `App.jsx` inside a `<BrowserRouter>`. There are three types of routes:
1. **Public routes** (`/`, `/menu`, `/cart`) — accessible to anyone
2. **Protected routes** (`/dashboard`, `/orders`, `/tracking`, `/profile`) — require authentication
3. **Admin routes** (`/admin`) — require authentication + admin role
4. **Public-only routes** (`/login`, `/register`) — redirect to `/menu` if already authenticated

The `ProtectedRoute` component checks `isAuthenticated` state and redirects to `/login` if not authenticated. The `PublicOnlyRoute` redirects authenticated users to `/menu`. The `LoginBookmarkRoute` programmatically opens the auth modal when navigating to `/login` or `/register`.

**Q: How did you handle cross-tab synchronization?**
**A:** We use a custom event system. When a user logs in or out, the code dispatches a `auth-changed` custom event on the `window` object. Additionally, we listen for the native `storage` event (which fires when localStorage changes in another tab). Both events trigger `verifySession()` to revalidate the auth state. This ensures that logging out in one tab also logs out in all other open tabs.

**Q: How are images uploaded?**
**A:** Admin users can upload food images via a drag-and-drop interface in the admin panel. The `ImageUpload` component in `AdminPage.jsx` uses `FormData` to send the file to `POST /api/menu/upload`. The backend uses multer (lazy-loaded) to handle multipart uploads, saving images to `public/images/{category}/` with a sanitized filename. The returned path is stored in the menu item's `image` field.

### Error Handling

**Q: How does the backend handle errors?**
**A:** We have two layers of error handling:
1. **Route handlers** use try-catch blocks and pass errors to `next(error)`
2. **Global error handler** in `app.js` (line 33-41) catches all errors, checks the `status` property (set by `createHttpError`), and returns an appropriate JSON response. Special error codes (`INVALID_USERS_JSON`, `INVALID_MENU_JSON`) return 500.
3. The `createHttpError()` utility creates Error objects with a numeric `status` property for HTTP status codes.

**Q: What happens if a JSON data file is corrupted?**
**A:** Both `userStore.js` and `menuStore.js` have JSON parsing with error handling. If the file contains invalid JSON, they throw an error with a specific code (`INVALID_USERS_JSON` or `INVALID_MENU_JSON`). The global error handler in `app.js` catches these and returns a 500 response. The atomic write pattern (temp file + rename) minimizes the risk of corruption.

### DevOps & Running

**Q: How do you run the application?**
**A:** In `package.json`:
- `npm run dev` — Starts Vite frontend dev server (port 5173)
- `npm run server` — Starts Express backend (port 3001)
- `npm run build` — Builds React app for production

Both need to be running simultaneously during development. The Vite dev server proxies `/api` and `/images` requests to the Express backend.

**Q: What environment variables can be configured?**
**A:** From `config.js` and the codebase:
- `PORT` — Backend port (default 3001)
- `JWT_SECRET` — JWT signing key (default `'dev-only-jwt-secret-change-me'`)
- `JWT_EXPIRES_IN` — Token expiry (default `'1h'`)
- `ADMIN_SECRET` — Secret code for admin registration (default `'admin123'`)
- `DATABASE_URL` — PostgreSQL connection string (optional, for orders)
- `VITE_API_BASE_URL` — API base URL for frontend (default `http://localhost:3001`)

### Security

**Q: What security measures are in place?**
**A:**
1. Passwords hashed with bcrypt (10 salt rounds)
2. JWT tokens with expiry (1 hour default)
3. Password hash never sent to client (`withoutPassword()`)
4. Input validation (email format, password length ≥ 8)
5. Email normalization (trim + lowercase)
6. Role-based access control (admin checks)
7. Soft delete with grace period (users can't be permanently deleted accidentally)
8. Atomic file writes prevent data corruption
9. Multer file size limit (5 MB)

---

## QUICK REFERENCE: FILE → LINE NUMBER MAP

When they ask "Which part of the code does X?":

| Question | File | Lines |
|----------|------|-------|
| Where is the JWT verified? | `auth.middleware.js` | 16-18 |
| Where are routes mounted? | `app.js` | 25-27 |
| Where is the project root set? | `config.js` | 10 |
| Where are passwords hashed? | `auth.routes.js` | 95 |
| Where is the admin check? | `auth.routes.js` | 248, 256, 268 |
| Where is the order ID generated? | `order.routes.js` | 45 |
| Where are file paths resolved? | `config.js` | 10-12 |
| Where are orders saved? | `orderStore.js` | 52-56 |
| Where is the cart stored? | `cartService.js` | 1-53 |
| Where is the proxy configured? | `vite.config.js` | 7-16 |
| Where is the auth modal opened? | `AuthModalContext.jsx` | 12-18 |
| Where is error handling? | `app.js` | 33-41 |
| Where is the atomic file write? | `userStore.js` | 49-53 |
| Where is PostgreSQL connected? | `orderStore.js` | 21-38 |
| Where is the address geocoded? | `OrderPage.jsx` | 53-91 |
| Where is the route guard? | `App.jsx` | 14-34 |
| Where is the 5-day grace set? | `auth.routes.js` | 16, 215 |
| Where is the expired account cleanup? | `auth.routes.js` | 47-60 |
| Where is the image uploaded? | `menu.routes.js` | 38-48 |
| Where is the "remember me" saved? | `AuthOverlay.jsx` | 52-55 |
| Where is the cross-tab auth sync? | `App.jsx` | 111-144 |
| Where is the menu filtered by category? | `menu.routes.js` | 54-57 |
| Where is the cart cleared after order? | `orderService.js` | 39-40 |
| Where is the order history shown? | `OrderPage.jsx` | 151-210 |
| Where is the tracking search? | `orderStore.js` | 46-51 |
