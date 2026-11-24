# ForkHub — Defense Guide (Adrian, Member 1 / PM)

Checked against the code on 2026-11-21.

- **Local `feature/csharp` (commit `43eda61`)** = JSON-file version. Line numbers in Parts 1, 2 and 4 are from this version.
- **`origin/feature/csharp` (commit `dca7c64`)** = 5 commits newer. This is the SQL (SQLite) version. Part 3 covers it.
- Your local copy is 5 commits behind. Run `git pull` (after saving your uncommitted changes) to see the SQL version on disk.

---

## Part 1 — How the system flows

### The big picture

```
Browser (React, localhost:5173)
   │  fetch('/api/...')  + "Authorization: Bearer <token>"
   ▼
Vite dev server  ── proxy /api and /images ──►  C# API (localhost:3001)
                                                  │
                         Program.cs pipeline:     │
                         1. error catcher         │
                         2. CORS                  │
                         3. JWT check             │
                         4. role check            │
                         5. static images         │
                         6. controller            │
                                                  ▼
                              JsonStore  →  data/users.json, menu.json, orders.json
                              (after SQL: ForkHubDbContext → App_Data/forkhub.db)
```

In simple words:

1. The React page calls a function in `src/services/` (or calls `fetch` directly).
2. The call goes to `/api/...`. Vite forwards it to port 3001 (`vite.config.js`, the `proxy` block). Some pages call `http://localhost:3001` directly. That is why CORS is needed.
3. The C# server receives it. `Program.cs` sends it through a fixed list of steps (the "pipeline").
4. The right controller method runs. It reads or saves data with `JsonStore`.
5. The controller sends back JSON. The page shows it.
6. If anything goes wrong, the controller throws `HttpError`. `Program.cs` turns it into `{ "message": "..." }`.

### Where things are stored

| Data | Where | Who sees it |
|---|---|---|
| Users, menu, orders | `data/*.json` now; SQLite after John Christian's change | Server only |
| Login token + user | Browser `localStorage`: `auth_token`, `auth_user` | Browser |
| Cart | Browser `localStorage`: `fh_cart_items` (`src/services/cartService.js:1`) | Browser only. **The server never sees the cart until checkout.** |
| Last order | Browser `localStorage`: `fh_last_order` (`orderService.js:38`) | Browser |
| Food pictures | `public/images/`, served at `/images` (`Program.cs:54-60`) | Everyone |

### Journey 1 — Sign up and log in

**Sign up**
1. `src/pages/Register.jsx:113` sends `POST /api/auth/register` with email, password, name, phone, address, and an optional admin code.
2. `AuthController.Register` (`server-cs/Controllers/AuthController.cs:13-38`):
   - Checks email and password are there (line 18).
   - Makes the email lowercase and trimmed (line 19, `Auth/Validators.cs:12`).
   - Checks email format and password length ≥ 8 (lines 20-21, `Validators.cs:7-11`).
   - Reads `users.json`. If the email exists → 409 (lines 23-24).
   - Hashes the password with BCrypt (line 29). The real password is never saved.
   - Role is `admin` only if the admin code matches `AdminSecret` in `appsettings.json` (line 32). Otherwise `customer`.
   - Saves the list (line 36). Returns 201.
3. `Register.jsx:132` then logs in right away with the same email and password.

**Log in**
1. `src/components/AuthOverlay.jsx:59` sends `POST /api/auth/login`.
2. `AuthController.Login` (`AuthController.cs:40-60`):
   - Finds the user by email (line 49). Not found → 401 "Invalid email or password".
   - If the account was deleted and the 5 days are over, it removes it now and says so (lines 51-57).
   - Checks the password with BCrypt (line 58).
   - Makes a token with `TokenService.CreateToken` (line 59, `Auth/TokenService.cs:9-23`). The token holds user id (`sub`), email, role, and an expiry (1 hour, `appsettings.json:12`).
3. The browser saves `auth_token` and `auth_user` (`AuthOverlay.jsx:72-74`). Admins go to `/admin` (line 84).
4. On every page load, `src/App.jsx:79` calls `GET /api/auth/profile` to check the token is still good.

**How the token is checked on later requests**
- `Auth/AuthExtensions.cs:17-25` tells ASP.NET: check the signature with the secret, check it has not expired, read `sub` as the user and `role` as the role.
- No token or a bad token on an `[Authorize]` route → 401 `{ message }` (lines 36-42).
- Wrong role → 403 `{ message: "Access denied" }` (lines 43-47).
- Controllers read the user with `User.GetUserId()` and `User.IsAdmin()` (lines 53-56).

### Journey 2 — Browse menu and add to cart

1. Menu pages call `getMenuItems()` or `getItemsByCategory()` (`src/services/menuService.js:20-26`, used by `src/components/CategoryModal.jsx`).
2. Request: `GET /api/menu` or `GET /api/menu?category=Pizza`. No login needed.
3. `MenuController.GetAll` (`server-cs/Controllers/MenuController.cs:55-60`) reads `menu.json` and filters by category.
4. Pictures load from `/images/...`, served by `Program.cs:54-60`.
5. **Add to cart happens only in the browser.** `src/components/CustomizeModal.jsx:100` works out the price (base price + size add-on). Line 107 calls `addToCart`, which saves to `localStorage` (`cartService.js:11-21`). No server call.

### Journey 3 — Checkout and place order

See the full step-by-step walkthrough in Part 4, section 4.5. Short version:
`OrderPage.jsx:103` → `orderService.saveOrder` (`orderService.js:35`) → `POST /api/orders` → `OrdersController.Create` (`OrdersController.cs:46-75`) → saved to `orders.json` → 201 with the new order → cart cleared.

### Journey 4 — Track an order

1. `src/pages/TrackingPage.jsx:16` calls `findOrder(query)` (`orderService.js:30-32`).
2. Request: `GET /api/orders/track?q=FH-1234567-12` (or a phone number).
3. `OrdersController.Track` (`OrdersController.cs:26-34`) finds the first order whose id **or phone** matches. **No login needed** (no `[Authorize]`). This is open bug 2.
4. Logged-in customers also see their history: `OrderPage.jsx:44` → `GET /api/orders` → `OrdersController.GetAll` (lines 17-23). Admin gets all orders, customer gets only their own.

### Journey 5 — Delete and restore own account

1. User deletes their account on the profile page → `authService.deleteUser` (`src/services/authService.js:5-20`) → `DELETE /api/auth/profile`.
2. `AuthController.DeleteProfile` (`AuthController.cs:91-116`) does **not** delete right away. It sets `isDeleted = true`, `deletedAt = now`, `scheduledDeletionAt = now + 5 days` (lines 104-106, grace days at line 88).
3. The user can still log in during the 5 days. `ProfilePage.jsx:147` calls `POST /api/auth/profile/restore` → `RestoreProfile` (lines 119-137) clears those three fields (helper `ClearDeletion`, lines 203-208).
4. After 5 days the account is removed in two ways:
   - `Services/AccountDeletionCleanupService.cs` runs when the server starts (line 17) and then every 24 hours (lines 20-25). It removes expired accounts (lines 35-45).
   - If the user tries to log in after the date, `Login` removes it right then (`AuthController.cs:51-57`).

### Journey 6 — Admin actions

All in `src/pages/AdminPage.jsx`. The browser hides the admin page for non-admins (`App.jsx:27-31`), but **the real protection is on the server**.

| Admin action | React call | Server code | Server check |
|---|---|---|---|
| Upload picture | `AdminPage.jsx:24` `POST /api/menu/upload` | `MenuController.Upload` lines 25-52 | `[Authorize(Roles = "admin")]` line 26; only image types (17-18, 36); max 5 MB (14, 32) |
| Add menu item | `addMenuItem` → `POST /api/menu` | `MenuController.Create` 72-95 | admin role line 73; name, category, price > 0 |
| Edit / hide item | `updateMenuItem` → `PUT /api/menu/{id}` | `MenuController.Update` 98-119 | admin role line 99; only changes fields that were sent |
| Delete item | `deleteMenuItem` → `DELETE /api/menu/{id}` | `MenuController.Delete` 122-133 | admin role; also deletes the unused picture (137-153) |
| See all orders | `getAllOrders` → `GET /api/orders` | `OrdersController.GetAll` 17-23 | logged in; admin sees all |
| Change order status | `updateOrderStatus` → `PUT /api/orders/{id}/status` | `OrdersController.UpdateStatus` 78-103 | admin can set any status; customer can only cancel own Pending order (87-92) |
| Delete order | `deleteOrder` → `DELETE /api/orders/{id}` | `OrdersController.Delete` 106-118 | admin only (line 110) |
| List users | `AdminPage.jsx:170` `GET /api/auth/users` | `AuthController.GetUsers` 140-150 | `User.IsAdmin()` line 144 |
| Restore user | `AdminPage.jsx:540` `POST /api/auth/users/{id}/restore` | `AuthController.RestoreUser` 179-200 | admin |
| Delete user now | `AdminPage.jsx:554` `DELETE /api/auth/users/{id}` | `AuthController.DeleteUser` 153-176 | admin; cannot delete another admin (166-167) |

---

## Part 2 — Who is responsible for what

Backend ownership comes from the git history (who wrote the commits). The React files were edited by many members, so for React I list the pages that belong to each feature.

| Part of the flow | Owner | Backend files | React files that use it |
|---|---|---|---|
| Server start-up, request pipeline, CORS, image serving, 404 answer | **Adrian (M1)** | `server-cs/Program.cs`, `server-cs/appsettings.json`, `server-cs/ForkHub.Api.csproj` (commit `7269a12`) | `vite.config.js` (proxy) |
| Error answers `{ message }` | **Adrian (M1)** | `server-cs/HttpError.cs`, `Program.cs:31-48`, `Program.cs:23-26`, `Program.cs:64-68` | Every service reads `body.message` (e.g. `menuService.js:14`) |
| Reading/saving data | **Adrian (M1)** now → **John Christian (M5)** after SQL | `server-cs/JsonStore.cs` → replaced by `server-cs/Data/` | — |
| Health check | **Adrian (M1)** | `server-cs/Controllers/HealthController.cs` | none (used for testing) |
| Register, login, profile, JWT | **Lyka (M2)** | `AuthController.cs:13-86`, `Auth/AuthExtensions.cs`, `Auth/TokenService.cs`, `Auth/JwtSettings.cs`, `Auth/Validators.cs`, `Models/AppUser.cs`, `Models/AuthRequests.cs`, `docs/AUTH_TRACEABILITY.md` | `Register.jsx`, `AuthOverlay.jsx`, `App.jsx` (session check), `ProfilePage.jsx` (view/edit) |
| UI redesign | **Lyka (M2)** | — | branch `feature/react` (commit `143fd3c`), `GourmetEmber.css`, page styles |
| Account delete/restore, admin users, daily cleanup | **Dave (M3)** | `AuthController.cs:88-231`, `Services/AccountDeletionCleanupService.cs`, `Program.cs:15` (registers the job) (commit `d4d50e1`) | `authService.js`, `ProfilePage.jsx` (delete/restore), `AdminPage.jsx` users tab (170, 540, 554) |
| Menu and image upload | **Nj (M4)** | `Controllers/MenuController.cs`, `Models/MenuItem.cs` | `menuService.js`, `CategoryModal.jsx`, `MenuPage.jsx`, `AdminPage.jsx` menu tab |
| Orders, tracking, cancel | **Nj (M4)**, covering for M5 | `Controllers/OrdersController.cs`, `Models/Order.cs` (commit `db13467`) | `orderService.js`, `OrderPage.jsx`, `TrackingPage.jsx`, `AdminPage.jsx` orders tab |
| Cart | Browser only (git history: Nj + this machine) | none | `cartService.js`, `CustomizeModal.jsx`, `CartPage.jsx` |
| JSON → SQL | **John Christian (M5)** | `server-cs/Data/*`, `server-cs/Migrations/*`, changes to all 3 controllers, cleanup service and `Program.cs` | none |

Note: the SQL commits are by the git user **"ScobberWasTaken"**. I assume that is John Christian. Please confirm.

---

## Part 3 — The move from JSON files to SQL

### Status: done, pushed and tested — it works, with one blocker (empty database on a fresh copy)

John Christian pushed **5 commits directly to `origin/feature/csharp`** on 2026-11-20 (not through a pull request):

| Commit | What it did |
|---|---|
| `3d0ad83` | Added EF Core + SQLite packages and table classes |
| `7e07ddb` | Copied the JSON data into SQLite when the API starts |
| `3cc39f3` | Switched all 3 controllers and the cleanup job to the database |
| `34db044` | Removed `JsonStore.cs` and the importer |
| `dca7c64` | Wrote test notes in `MIGRATION_PROGRESS.md` (repo root) |

The database is **SQLite** (a single file, `server-cs/App_Data/forkhub.db`), not SQL Server or MySQL. Tables: `Users`, `MenuItems`, `Orders`, `OrderItems` (`server-cs/Data/ForkHubDbContext.cs:9-12`). He reports 7 users, 36 menu items, 6 orders, 7 order items moved, and build with 0 errors.

Two commits say "Co-authored-by: Cursor" (an AI coding tool). Not a problem, but he should be able to explain the code himself at the defense.

### What changed

| File | Change |
|---|---|
| `JsonStore.cs` | **Deleted.** |
| `Program.cs` | Line 12 (`AddSingleton(new JsonStore(...))`) replaced by lines 15-26: make `App_Data` folder, read connection string `ForkHub`, register `ForkHubDbContext`. New lines 76-80: create/update the tables at start-up (`MigrateAsync`). Everything else (error catcher, CORS, auth, images, 404) is the same. |
| `appsettings.json` | New `ConnectionStrings:ForkHub = "Data Source=App_Data/forkhub.db"`. |
| `ForkHub.Api.csproj` | New packages: `Microsoft.EntityFrameworkCore.Sqlite`, `Microsoft.EntityFrameworkCore.Design`. |
| `Data/` (new) | `ForkHubDbContext.cs` (the tables and rules), `UserEntity.cs`, `MenuItemEntity.cs`, `OrderEntity.cs`, `OrderItemEntity.cs`, `EntityMapping.cs` (turns rows back into the same JSON shape as before). |
| `Migrations/` (new) | `InitialCreate` and `AddMenuItemPosition` — the scripts that build the tables. |
| `AuthController.cs`, `MenuController.cs`, `OrdersController.cs` | Take `ForkHubDbContext db` instead of `JsonStore store`. `ReadAsync` + `WriteAsync` become `db.X.Where/Add/Remove` + `SaveChangesAsync`. |
| `AccountDeletionCleanupService.cs` | Uses the database (opens its own scope, because a background job lives longer than one request). |

### What stays the same

- Same addresses (`/api/auth/...`, `/api/menu/...`, `/api/orders/...`), same port 3001.
- Same JSON answers. `EntityMapping.cs` rebuilds the old shape, e.g. `branch` and `destination` objects are split into columns in the database (`OrderEntity.cs`) and joined back for the answer.
- Same `{ message }` errors (your `HttpError` + `Program.cs` catcher are untouched).
- No React file changed.
- The old `data/*.json` files are kept as backups but **no longer read**.

### What I checked — review notes for John Christian's work

Good:
- Each order line is now its own row in `OrderItems`, tied to its order. Deleting an order deletes its lines (`ForkHubDbContext.cs:54-57`).
- `Users.Email` is unique in the database (`ForkHubDbContext.cs:23`), and register catches the duplicate error and still answers 409.
- `Orders.UserId` is not a foreign key on purpose, so old orders stay after a user is deleted (`ForkHubDbContext.cs:44`).
- Price is stored with 2 decimal places (`HasPrecision(18, 2)`).

**Problems to raise before you merge or demo:**

1. **A fresh copy of the project starts with an EMPTY database.** The `.db` file is ignored by git (`server-cs/.gitignore`: `App_Data/*.db`), and the importer was deleted in `34db044`. There is no seed data in the migrations. So on any other laptop — including the defense laptop — the menu is empty and no users exist. Fix: bring back a one-time import from `data/*.json` when the tables are empty, or add seed data, or share the `.db` file. **Test this by cloning the repo into a new folder and running it.**
2. ~~He did not test any save actions.~~ His notes said register, profile edit, delete/restore, menu changes and orders were not tested. **I tested all of them on 2026-11-21 and they pass** (see "Test results" below).
3. **Small change in saved order items.** Cart fields that were not sent now come back as empty text (`"category": ""`) instead of being left out. This comes from `EntityMapping.ReadItems`, which saves fixed columns. Any extra field outside those columns is dropped. The website doesn't rely on this, so it is safe.
4. **Bugs 1, 2 and 3 are still there** in the SQL version (`OrdersController.cs`: `Total = body.Total` line 64, no `[Authorize]` on `Track` line 26, any status text line 95). That is expected — it was not his task — but don't tell the panel SQL fixed them.
5. **Tracking loads every order** and searches in C# (`LoadOrdersAsync`, lines 122-130). Fine for 6 orders. With a database it should be a `Where` query so the database does the search.
6. ~~His PC lacks the ASP.NET 9 runtime.~~ He had to run it on .NET 10. **Checked: it builds and runs on a normal .NET 9 machine (SDK 9.0.318, ASP.NET 9.0.20).**
7. **It skipped a pull request.** Ask for a PR next time so someone reviews it before it lands on the main C# branch.

### Test results (run 2026-11-21)

How it was tested: separate copies of three versions ran side by side on test ports (3101-3103). Your own files and port 3001 were not touched. The same test script ran against the SQL version (`dca7c64`) and the old JSON version (`43eda61`).

| Check | SQL version | Old JSON version |
|---|---|---|
| Build | 0 warnings, 0 errors | 0 warnings, 0 errors |
| 69 end-to-end checks: register, login, wrong password, profile view/edit, bad token, menu add/edit/hide/delete, image upload (and `.html` blocked), place / track / cancel / delete order, customer blocked from admin actions, account delete / restore, admin list / restore / delete users, 404 for unknown route | **All pass** | All pass |
| JSON field names sent back to the website | Same as JSON version | — |
| **30 orders placed at the same moment** | **30 saved** | **Only 2 saved.** 29 customers were told "201 Created", and 1 got a 500 error. |
| One-time import (commit `3cc39f3`) compared with `data/*.json` | Menu (36) and orders (6) **identical**. Users (7) identical, password hashes kept. | — |
| Data still there after a server restart | Yes | — |
| Fresh copy, no `.db` file | **Menu count 0** — problem 1 confirmed | 36 items |

Not tested:
- The image upload used a tiny fake PNG, not a real photo.
- The tests called the API directly, not through the React website on top of the SQL version.
- The background cleanup job after 5 days (that would need a wait or a fake date).

### Does SQL fix the "two saves at once" bug?

Mostly yes, but say it carefully:

- **Fixed:** Two people placing orders at the same time. Before, both read the whole file, each added one order, each saved the whole file → one order lost. Now each order is one `INSERT` of one row. Nothing is lost. **Proven in testing:** 30 orders at once → JSON kept 2, SQL kept all 30.
- **Fixed:** Two admins editing **different** menu items or users. Each save only changes its own row.
- **Not fully fixed:** Two changes to the **same** order at the same time. Example: customer cancels (server checks "still Pending") while admin sets "Preparing". The last save wins. To stop this you would add a version column (EF Core "concurrency token") or a transaction. There is none in the code now.

---

## Part 4 — Study guide: the code you own

### 4.1 `server-cs/Program.cs` (local version, 70 lines)

Think of it as the **front door and the hallway** of the server. Every request walks through it in order.

**Setup (before the server starts)**

| Line | What it does |
|---|---|
| 1-5 | Imports. Lets this file use the project's own code (`ForkHub.Api`, `.Auth`, `.Services`) and ASP.NET parts. |
| 7 | Creates the "builder". It also reads `appsettings.json` (port 3001, JWT secret, admin code). |
| 9-10 | Finds the project root: one folder up from `server-cs`. That is where `data/` and `public/` are. `RootDir` in config can change it. |
| 12 | Registers **one shared `JsonStore`** for the whole app, pointing at `data/`. "Singleton" = one copy for everyone, so the lock inside it is shared. Controllers get it by asking for `JsonStore store` in their constructor. |
| 14 | Turns on JWT login checking. Code is Lyka's `Auth/AuthExtensions.cs`. |
| 15 | Starts Dave's daily cleanup job in the background. |
| 17-21 | CORS: only the website at `http://localhost:5173` may call the API from the browser, with GET/POST/PUT/DELETE. Without this the browser blocks direct calls (like `AuthOverlay.jsx:59`). |
| 23 | Finds all controllers (Auth, Menu, Orders, Health). |
| 24-26 | If the request body is broken JSON, answer `400 { message: "Invalid request body" }` instead of ASP.NET's long default error. Keeps the same shape as the old Node server. |
| 28 | Builds the app. After this line we describe the **pipeline** (order matters). |

**Pipeline (runs on every request, top to bottom)**

| Line | What it does |
|---|---|
| 31-48 | **Error catcher.** Wraps everything after it in `try`. |
| 35 | `await next()` = "let the rest of the pipeline run". |
| 37-41 | If someone threw `HttpError`, use its status code and send `{ message }`. |
| 42-47 | Any other crash: write it to the log, send `500 { message: "Internal server error" }`. The user never sees the real error details. |
| 50 | CORS check (rules from 17-21). |
| 51 | **Who are you?** Reads the `Bearer` token and fills `User`. |
| 52 | **Are you allowed?** Applies `[Authorize]` and `[Authorize(Roles = "admin")]`. Must come after 51. |
| 54-55 | Path to `public/images`. Creates the folder if missing. |
| 56-60 | Any request starting with `/images` gets a file from that folder (food pictures). |
| 62 | Sends `/api/...` requests to the right controller method. |
| 64-68 | Nothing matched → `404 { message: "Route not found: GET /api/xyz" }`. Same as Node. |
| 70 | Start listening on port 3001. |

**Why the error catcher is first:** it must wrap everything, so an error anywhere — auth, controller, `JsonStore` — still comes back as `{ message }`.

### 4.2 `server-cs/JsonStore.cs` (57 lines)

The **only** place that touches the JSON files. Controllers never open files themselves.

| Line | What it does |
|---|---|
| 1-2 | Imports for JSON. |
| 6-9 | Comment showing how to use it: `ReadAsync<User>("users.json")`, then `WriteAsync`. |
| 10 | The class. `dataDir` is the `data/` folder path given in `Program.cs:12`. |
| 14 | `JsonSerializerDefaults.Web` = use **camelCase** (`firstName`, not `FirstName`). This keeps the field names React expects. `static` = shared by everyone, including Nj's `MenuItem` and `Order`. |
| 16 | `WriteIndented` = save the file pretty, one field per line, so it's readable and git diffs are clean. |
| 17 | "Relaxed escaping" = write `&` and `ñ` as normal characters, like Node does. |
| 21 | `SemaphoreSlim(1, 1)` = a lock with **one key**. Only one save at a time. |
| 23 | `ReadAsync<T>`: read a file and turn it into a list of `T` (users, menu items or orders). |
| 25 | Full path of the file. |
| 26 | File missing → return an empty list (no crash). |
| 28-32 | Open the file and turn JSON into C# objects. If the file says `null`, return an empty list (`?? []`). |
| 33-36 | File has broken JSON → throw `HttpError(500, "orders.json contains invalid JSON")`. The catcher in `Program.cs` sends that as `{ message }`. |
| 39 | `WriteAsync<T>`: save a full list back to a file. |
| 41-42 | Real path and a temporary path (`orders.json.tmp`). |
| 44 | Wait for the one key. |
| 47 | Make sure `data/` exists. |
| 49 | Write all data to the **temp** file first. |
| 50 | Swap the temp file in place of the real one. If the server crashes mid-write, the real file is still the old, complete one. |
| 52-55 | `finally` = always give the key back, even if writing failed. Otherwise the server would freeze on the next save. |

**The known weak spot (be honest about it):** the lock is only around the save (lines 44-55). Reading is not locked. Every controller does **read → change → save**. Two requests at once can both read the same old list, and the second save erases the first one's change. Example: two customers order at the same time → one order disappears. A fix would lock the whole read-change-save, but John Christian's SQL move fixes it better: each order is a separate row insert.

### 4.3 `server-cs/HttpError.cs` (8 lines)

| Line | What it does |
|---|---|
| 1 | Namespace (the folder "name" of the code). |
| 3-4 | Comment: throw it anywhere, like `createHttpError` in the old Node code (`server/utils/`). |
| 5 | `HttpError` is an `Exception` that also carries a status number. `Exception(message)` stores the text. |
| 7 | `Status` = the HTTP code (400, 401, 403, 404, 409, 500). Read-only. |

**How it's used:** a controller writes `throw new HttpError(404, "Order not found");`. The code stops right there. `Program.cs:37-41` catches it and sends `404 { "message": "Order not found" }`. The React services read `body.message` and show it (e.g. `orderService.js:13`).

Why this is good: every member's code throws errors the same way, and the website always gets the same shape.

### 4.4 `server-cs/Controllers/HealthController.cs` (12 lines)

| Line | What it does |
|---|---|
| 1 | Import for controllers. |
| 5 | Comment: the example for the team to copy. |
| 6 | `[ApiController]` = turn on automatic JSON reading and the "Invalid request body" check. |
| 7 | `[Route("api/health")]` = this class answers `/api/health`. |
| 8 | Inherits `ControllerBase` → gets `Ok()`, `StatusCode()`, `User`, `Request`. |
| 10-11 | `GET /api/health` returns `200 { "status": "ok" }`. |

Use: open `http://localhost:3001/api/health` to prove the server is running before testing anything else. It is the template the others followed: `[ApiController]` + `[Route("api/...")]` + one method per action.

### How everyone else plugs into your code

```
Program.cs:12  registers JsonStore ──► injected into AuthController (Lyka, Dave)
                                        MenuController (Nj)
                                        OrdersController (Nj)
                                        AccountDeletionCleanupService (Dave)
Program.cs:14  calls Lyka's AddForkHubAuth()
Program.cs:15  starts Dave's cleanup job
Program.cs:51-52  run Lyka's token check for every [Authorize] in all controllers
Program.cs:62  maps all controllers
HttpError       thrown by every controller and by JsonStore
Program.cs:31-48  turns every thrown HttpError into { message }
```

After SQL: line 12 is replaced by `ForkHubDbContext`, and the controllers ask for `ForkHubDbContext db` instead. Your error catcher, CORS, auth order, images and 404 stay exactly the same.

### 4.5 Full walkthrough: placing an order

**In the browser**

1. Customer picks a pizza. `CustomizeModal.jsx:100` works out the price. Line 107 → `addToCart` → saved in `localStorage` (`cartService.js:11-21`).
2. Customer goes to checkout and clicks Place Order → `handlePlaceOrder` (`OrderPage.jsx:103`).
3. Browser checks: cart not empty (104), address or map pin for delivery (105-108), phone filled (109-112).
4. `saveOrder` (`orderService.js:35-42`) builds the body: service type, branch, address, phone, destination, **plus `items` from the cart and `total` from `getCartTotal()`** (line 36).
5. `req` (lines 6-16) sends `POST /api/orders` with `Authorization: Bearer <token>` (line 8).
6. Vite forwards `/api` to `http://localhost:3001` (`vite.config.js`).

**In the server**

7. `Program.cs:31` error catcher starts its `try`.
8. `Program.cs:50` CORS: OK.
9. `Program.cs:51` reads the token. `AuthExtensions.cs:20-25` checks signature and expiry. `User` now has the customer's id and role.
10. `Program.cs:52` checks `[Authorize]` on `OrdersController.cs:47`. Not logged in → 401 `{ message }` and stop.
11. `Program.cs:62` picks `OrdersController.Create`. ASP.NET turns the body into `PlaceOrderRequest` (`Models/Order.cs:36-45`). Broken JSON → `Program.cs:25-26` → 400.
12. `OrdersController.cs:50-52` checks: items not empty, phone given, address given for Delivery. Fail → `throw new HttpError(400, ...)` → caught at `Program.cs:37-41`.
13. Lines 55-58 make an id like `FH-8496943-12` (last 7 digits of the time + random 10-99).
14. Lines 56-69 build the order: user id from the token (59), status `Pending` (60), time (61), items and **total as the browser sent them** (62-63).
15. Line 71: `store.ReadAsync<Order>("orders.json")` → `JsonStore.cs:23-37` reads the file.
16. Line 72: add the new order to the list.
17. Line 73: `store.WriteAsync` → `JsonStore.cs:39-56` locks, writes the temp file, swaps it in, unlocks.
18. Line 74: answer `201` with the order in camelCase JSON.

**Back in the browser**

19. `orderService.js:38` saves it as `fh_last_order`. Line 39 clears the cart.
20. `OrderPage.jsx:122-123` shows the confirmation with the order id. The customer uses that id on the Tracking page.

**After SQL:** steps 15-17 become `db.Orders.Add(order)` + `db.SaveChangesAsync()` (SQL version `OrdersController.cs:73-74`), and the items become rows in `OrderItems` (line 69). Everything else is the same.

**Where bug 1 lives:** step 4 and step 14. The price comes from the browser (`CustomizeModal.jsx:100`, `orderService.js:36`) and the server saves it as-is (`OrdersController.cs:63`). Someone can edit `localStorage` or send their own request with `total: 1`. Fix: server looks up each item's price in the menu and adds it up itself.

### 4.6 Open bugs — where each one is in the code

| # | Bug | Owner | Exact place |
|---|---|---|---|
| 1 | Customer can set the price | Nj | `OrdersController.cs:62-63` saves `body.Items` and `body.Total` as sent |
| 2 | Guest can track and see address/phone | Nj | `OrdersController.cs:26` `Track` has no `[Authorize]`; also searches by phone (line 31) |
| 3 | Admin can save status "asdf" | Nj | `OrdersController.cs:94` sets any text; only empty is blocked (line 82) |
| 4 | No lockout after 5 wrong passwords | Lyka | `AuthController.cs:58` just answers 401; no counter is stored anywhere |
| — | Two saves at once can lose data | Adrian → fixed by SQL | `JsonStore.cs:21` lock covers only `WriteAsync` |

**Extra issues I found while reading (not on your list):**
- `GET /api/orders/{id}` (`OrdersController.cs:37-43`) also has **no `[Authorize]`**. Anyone with an order id gets the address and phone. Same family as bug 2; fix both together.
- `AdminSecret` is `"admin123"` and the JWT secret is written in `server-cs/appsettings.json:11,14`, which is in git. Anyone who reads the repo can register as admin. For a real deployment these go in environment variables / user secrets.

**Unit tests:** I could not find a test project in the repo (no `*Tests*` folder or test files on any branch I checked). The "48/52 pass" number can't be checked from the repo. If the tests are on your machine only, push them — the panel may ask to see them.

---

## Part 5 — Panel questions and short answers

**Q: Explain the flow of your system in one breath.**
A: The React page calls a service, the service sends a request to the C# API on port 3001 with the login token. `Program.cs` runs it through error handling, CORS, the token check and the role check, then the right controller does the work, reads or saves data, and sends JSON back. Errors always come back as `{ message }`.

**Q: What did you build, as Member 1?**
A: The base everyone builds on. `Program.cs` starts the server and sets the order of steps for every request. `JsonStore` is the one safe place that reads and saves data. `HttpError` lets anyone stop a request with a status and a message. `HealthController` is the example controller and a quick "is the server up" check.

**Q: Why convert from Node to C#?**
A: (Give the team's real reason — course requirement, typed language, etc. It's not in the code.) Technically: C# checks types before running, ASP.NET has login, CORS and background jobs built in, and we kept the same addresses and JSON so the website didn't need to change.

**Q: How did you make sure the React site still works after the change?**
A: Three rules: same port 3001, same addresses, same JSON field names. `JsonStore.cs:14` forces camelCase names. `Program.cs` sends errors in the same `{ message }` shape as Node. The 404 text even matches.

**Q: Why does the order of lines in `Program.cs` matter?**
A: Each step wraps the next. The error catcher is first so it catches errors from everything. Authentication (who are you) must come before authorization (are you allowed). Controllers come last.

**Q: What happens if the server crashes in the middle of saving?**
A: Nothing is lost. `JsonStore` writes to a temp file first, then swaps it in (`JsonStore.cs:49-50`). The old file stays whole until the new one is complete.

**Q: What is `SemaphoreSlim` for?**
A: A lock with one key. Only one save runs at a time, so two saves can't mix inside the file.

**Q: So two people can never overwrite each other?**
A: Not quite — and we found that. The lock only covers the save, not the read before it. Two requests can read the same old list, and the later save wins. We tested it: 30 orders sent at the same moment, and the JSON version kept only 2. The SQL version kept all 30. That's the main reason we moved to a database.

**Q: Why move from JSON to SQL?**
A: Four reasons.
1. **Safe at the same time.** A database handles many users writing at once. Each new order is its own row, so orders don't get lost. In our test, 30 orders at once: JSON kept 2, SQL kept 30.
2. **Faster.** With JSON we read and rewrite the whole file for every change. A database changes one row and can search with an index.
3. **Rules in the data.** The database itself makes email unique and links order lines to their order.
4. **Real-world skill.** Real systems use databases, not text files.

**Q: Why SQLite and not MySQL or SQL Server?**
A: It's one file with no server to install, so every member can run it. Because we use EF Core, switching to SQL Server later is mostly changing `UseSqlite` to `UseSqlServer` and the connection string.

**Q: What changed in the code for SQL, and what didn't?**
A: `JsonStore` was replaced by `ForkHubDbContext`, and the controllers now use `db.Orders.Add` and `SaveChangesAsync` instead of read-list/write-list. Addresses, JSON answers, error shape and the whole React site stayed the same.

**Q: Where is the data stored now?**
A: Before: `data/users.json`, `menu.json`, `orders.json`. After: `server-cs/App_Data/forkhub.db` with tables Users, MenuItems, Orders and OrderItems. The cart is never on the server; it's in the browser's localStorage until checkout.

**Q: How does login work?**
A: Password is hashed with BCrypt on register. On login we check the hash and give back a JWT token signed with a secret. It holds user id, email and role, and lasts one hour. The browser sends it on every request; ASP.NET checks the signature and expiry.

**Q: How do you stop a customer from doing admin things?**
A: The server checks the role in the token. `[Authorize(Roles = "admin")]` on menu changes, and `User.IsAdmin()` checks in orders and users. Hiding the admin page in React is only for looks; the server is the real guard.

**Q: What are your known bugs?**
A: Four from unit tests: price comes from the browser, tracking needs no login, admin can set any status text, and no lockout after wrong passwords. Plus the save race, which SQL fixes. We know where each one is in the code and who owns it.

**Q: How do you fix the price bug?**
A: The server should ignore the browser's price. It should look up each item in the menu, add size extras, multiply by quantity, and calculate the total itself.

**Q: As PM, how did you manage the work?**
A: Each member owns a controller and a branch. I set up the base so everyone used the same patterns (`HealthController` as the template, `HttpError` for errors, `JsonStore` for data). Work comes in through branches and pull requests, I review, then merge into `feature/csharp`.
(Be ready: the SQL work was pushed straight to `feature/csharp` without a PR. Say you reviewed and tested it afterwards: all 69 API checks passed, the data import matched, and the 30-orders-at-once test passed.)

**Q: What's the 5-day account deletion?**
A: Deleting only marks the account and sets a date 5 days later. The user can restore it in that time. A background job runs at start-up and every 24 hours and removes expired ones. Login also removes it if the date has passed.
