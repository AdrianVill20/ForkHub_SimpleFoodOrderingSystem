# ForkHub migration progress

Reference for future chats if the conversation expires.

- Project: ForkHub Simple Food Ordering System
- Current branch: feature/csharp
- Phase 1 commit: 3d0ad83
- Phase 1: Completed and committed.
- Phase 2: Completed and committed.
- Phase 3: Completed and committed.
- Phase 4: Completed and committed.
- Latest commit: `34db044` — Remove JSON storage from C# backend.
- SQLite and EF Core packages installed: version 9.0.23.
- Created UserEntity, MenuItemEntity, OrderEntity, OrderItemEntity, and ForkHubDbContext.
- Registered SQLite in Program.cs.
- Database file: forkhub/server-cs/App_Data/forkhub.db
- The connection string in appsettings.json is `Data Source=App_Data/forkhub.db`. Program.cs turns that relative path into a full path beside the project.
- Original JSON files are still present and unchanged.
- JSON startup import is removed. Original JSON files remain as backups and are not read by the C# API.
- No cart tables were created.

## Phase 2 details

- Migration: `forkhub/server-cs/Migrations/20261120141112_InitialCreate.cs`
- Tables: Users, MenuItems, Orders, OrderItems.
- Orders.UserId is indexed and is not a foreign key, so orders remain when the customer is gone.
- OrderItems.OrderId is a foreign key to Orders and deletes with the order.
- Users.Email is unique.
- Import class was used only during migration and is removed after the SQLite database is populated.
- The API applies the migration and imports missing rows at startup, before it accepts requests.
- A second run skips ids that are already stored. It does not insert duplicates.
- Imported counts: 7 users, 36 menu items, 6 orders, 7 order items.
- Two orders, FH-8496943-12 and FH-9639360-94, point at user id f9860436-7b49-4b16-b7ba-dbf3aec830de, which is not in users.json. Those orders were still imported.
- Each order line keeps the website's item id in OrderItems.ItemId. Its database id is `{orderId}:{position}`, for example `FH-9837923-39:0`.
- Password hashes, timestamps, prices, notes, branch fields, and destination fields were copied as stored.
- The oldest user has no createdAt. That value is null in SQLite.
- Menu items that omit `unavailable` store null. pizza_1 stores false.
- Last build result after Phase 2: 0 warnings and 0 errors.
- JSON SHA-256 hashes after import:
  - users.json: 82D16608AC1D058BD7BE850A861EB4851E6F79BFB2B8EB7D8B07D1AB75F5B2B0
  - menu.json: 816AEA77C55D547733717B06F10F2EB2C79DD96588ED27A5EA45CF68BDC2FA2B
  - orders.json: 10EFE7AB8C5793C2E2B5C7E95E72B3DBD04A05832768A586F9B721A1FF9A3253

## Re-check

Checked again on 2026-11-20 without rewriting Phase 1 or the Phase 2 files.

- `dotnet build`: 0 warnings, 0 errors.
- `App_Data/forkhub.db` already had migration `20261120141112_InitialCreate` (EF Core 9.0.23). Startup did not apply a second migration.
- Starting the API again added 0 rows. It skipped 7 users, 36 menu items, 6 orders, and 7 order items.
- SQLite still holds those same 7, 36, 6, and 7 rows. Users.Email is a unique index. Orders.UserId is not a foreign key. OrderItems.OrderId deletes with the order.
- The two orders for missing user `f9860436-7b49-4b16-b7ba-dbf3aec830de` are still stored.
- JSON SHA-256 hashes were unchanged after this startup.
- This PC has the .NET 9 base runtime, but not the ASP.NET 9 shared framework. `dotnet run` fails until that framework is installed. The check above used `DOTNET_ROLL_FORWARD=Major` so the existing ASP.NET 10 runtime could host the .NET 9 app. The project still targets `net9.0`.

## Next task

Phase 3 is complete. AuthController, MenuController, and OrdersController use ForkHubDbContext.

## Phase 3 details

- AuthController now reads and writes UserEntity rows for registration, login, profile operations, account deletion/restoration, and admin user management.
- MenuController now reads and writes MenuItemEntity rows. Menu ordering uses Position and image cleanup still checks the database.
- OrdersController now reads and writes OrderEntity and OrderItemEntity rows, including order tracking, status changes, cancellation, and deletion.
- Shared database-to-response mapping is in EntityMapping.cs.
- JsonStore was used only for startup JSON importing and has now been removed.
- AccountDeletionCleanupService also uses the database for scheduled account purges.

## Phase 3 verification

- Checked git status and preserved the existing working-tree changes.
- `dotnet build`: 0 warnings and 0 errors.
- Started the API with `DOTNET_ROLL_FORWARD=Major`: no migrations were applied and startup reused the existing SQLite data.
- Startup import skipped all existing rows: 7 users, 36 menu items, 6 orders, and 7 order items.
- Smoke test returned 36 menu items from `/api/menu`.
- Smoke test returned order `FH-8496943-12` with 1 order item from `/api/orders/track?q=FH-8496943-12`.
- No frontend or Node backend files were changed. JSON files were not deleted or rewritten by these controller changes.

## Phase 3 review

- Re-checked `feature/csharp` status and recent commits. HEAD is still `7e07ddb`.
- Phase 1 is committed.
- Phases 2–3 and their supporting files remain uncommitted in the working tree.
- The Phase 3 controller review found no remaining `JsonStore` reads or writes in AuthController, MenuController, or OrdersController.
- The build was re-run successfully with 0 warnings and 0 errors.
- Nothing was committed or advanced to Phase 4.

## Phase 4

- JSON startup importing and JsonStore registration were removed.
- JsonDataImporter and the JsonStore source file were removed.
- JSON-specific persistence models were removed while response/request DTOs were retained.
- The original users.json, menu.json, and orders.json backups remain unchanged.

## Phase 4 verification

- `dotnet build`: 0 warnings and 0 errors.
- The API started without a JSON import step and reported the database already up to date.
- `/api/menu` returned 36 menu items.
- `/api/orders/track?q=FH-8496943-12` returned the tracked order and one order item.
- Original JSON SHA-256 hashes remain unchanged.

## Phase 5 — Final testing and verification

### Git and build

- `feature/csharp` is clean after commit `34db044`.
- Recent commits: `34db044` (Phase 4), `3cc39f3` (Phase 3), `7e07ddb` (Phase 2), `3d0ad83` (Phase 1).
- `dotnet build`: 0 warnings and 0 errors.

### Database

- Applied migrations:
  - `20261120141112_InitialCreate`
  - `20261120151642_AddMenuItemPosition`
- Existing row counts:
  - Users: 7
  - MenuItems: 36
  - Orders: 6
  - OrderItems: 7
- Accounts scheduled for permanent deletion: 0.
- No migration was reapplied by API startup.

### Authentication and authorization

- Passed: registration missing fields returned 400.
- Passed: registration with an existing email returned 409.
- Passed: login with an unknown account and wrong password returned 401.
- Passed: profile, admin-user, menu-admin, order-create, order-status, order-delete, and account-delete requests without authentication returned 401.
- Not run with persisted mutations: successful registration, login for an existing account, profile update, profile deletion/restoration, or admin-user operations. Existing plaintext passwords were not available, and mutating tests were excluded.

### Menu and orders

- Passed: `/api/menu` returned 36 menu items.
- Passed: tracking order `FH-8496943-12` returned Pending status and 1 order item.
- Passed: tracking an unknown order returned 404.
- Not run with persisted mutations: menu admin create/update/delete, order creation, order cancellation/status changes, and order deletion. These tests require authenticated sessions and would alter stored data.

### Restart and backup verification

- Stopped and restarted the API successfully.
- After restart, menu still returned 36 items.
- Tracked order `FH-8496943-12` still returned status Pending and 1 order item.
- No new migration or import step ran.
- `users.json`, `menu.json`, and `orders.json` SHA-256 hashes remain unchanged.
- Git status shows no frontend or Node.js backend changes.
