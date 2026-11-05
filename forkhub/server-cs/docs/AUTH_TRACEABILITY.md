# Authentication conversion traceability

## Node to C# route and function mapping

| Node route/function | C# implementation | C# line |
|---|---|---:|
| `withoutPassword` (`auth.routes.js:18`) | `AppUser.ToResponse()` | 22 |
| `issueToken` (`auth.routes.js:40`) | `TokenService.CreateToken` | 9 |
| `POST /register` (`auth.routes.js:65`) | `AuthController.Register` | 14 |
| `POST /login` (`auth.routes.js:121`) | `AuthController.Login` | 41 |
| `GET /profile` (`auth.routes.js:162`) | `AuthController.GetProfile` | 64 |
| `PUT /profile` (`auth.routes.js:177`) | `AuthController.UpdateProfile` | 74 |
| `requireAuth` (`auth.middleware.js:4`) | JWT bearer configuration and `[Authorize]` | `AuthExtensions.cs:11`, controller lines 62 and 72 |
| `validateEmail` / `validatePassword` / `normalizeEmail` (`validators.js:4,8,12`) | `Validators` | `Validators.cs:10-12` |

## Replaced libraries and mechanisms

| Node mechanism | C# replacement |
|---|---|
| `bcrypt` | BCrypt.Net-Next 4.0.3 |
| `jsonwebtoken` | ASP.NET Core JwtBearer validation and `TokenService` HS256 signing |
| `uuid` | `Guid.NewGuid()` |
| `requireAuth` | `[Authorize]` with bearer token middleware |

## Preserved response statuses and messages

| Status | Message / response | Cases |
|---:|---|---|
| 200 | `{ token, user }` | Successful login |
| 200 | `{ user }` | Successful profile read or update |
| 201 | `{ user }` | Successful registration |
| 400 | `Email and password are required` | Missing email or password |
| 400 | `Invalid email format` | Email fails validation |
| 400 | `Password must be at least 8 characters long` | Password too short |
| 401 | `Invalid email or password` | Unknown email or wrong password |
| 401 | `This account has been permanently deleted` | Deleted account's grace period elapsed |
| 401 | `Missing or invalid authorization token` | Missing or malformed bearer authorization header |
| 401 | `Invalid or expired token` | Invalid, expired, or tampered token |
| 403 | `Access denied` | Authenticated principal fails an authorization role policy |
| 404 | `User not found` | Authenticated token refers to no stored user |
| 500 | `JWT secret is not configured` | Login without a configured secret |

All error bodies use `{ "message": "..." }`.

## Files added or changed

| File | Purpose |
|---|---|
| `ForkHub.Api.csproj` | Adds BCrypt.Net-Next and JwtBearer packages. |
| `Program.cs` | Registers auth services and adds authentication/authorization middleware. |
| `Auth/JwtSettings.cs` | Binds JWT settings, creates signing key, and parses expiry values. |
| `Auth/TokenService.cs` | Issues signed HS256 tokens with subject, email, role, issued-at, and expiry claims. |
| `Auth/Validators.cs` | Implements email/password validation and email normalization. |
| `Auth/AuthExtensions.cs` | Configures bearer validation, JSON challenge/forbidden responses, and principal helpers. |
| `Models/AppUser.cs` | Represents persisted users, preserves unknown fields, and shapes safe API responses. |
| `Models/AuthRequests.cs` | Defines nullable request records for auth endpoints. |
| `Controllers/AuthController.cs` | Implements register, login, and profile read/update routes. |
| `docs/AUTH_TRACEABILITY.md` | Documents the conversion and records test outcomes. |

## Login and token flow in five steps

1. The login endpoint trims and lowercases the submitted email, then reads users through the shared `JsonStore`.
2. It checks the stored BCrypt hash against the submitted password; on success it creates a token for that user's ID, email, and role.
3. The token is signed with the configured JWT secret using HS256 and includes issued-at and expiry times.
4. The client sends the token in an `Authorization: Bearer ...` header on protected profile requests.
5. JwtBearer validates the signature and lifetime before `[Authorize]` lets the controller use the token subject to find the user's profile.

## Requested live tests

| # | Test | Result |
|---:|---|---|
| 1 | Profile request without token returns 401 `Missing or invalid authorization token` | Pending |
| 2 | Existing account login returns 200 with token and user | Not run: no existing account password was provided, and no password was changed. A newly registered test account logged in successfully with 200 and returned a token and user. |
| 3 | Profile request with valid token returns 200 | Passed with the new test account (200, user response). |
| 4 | Existing account login with wrong password returns 401 `Invalid email or password` | Passed (401, exact message). |
| 5 | New test user registration returns 201; duplicate registration returns 409 | Passed (201, then 409 with `A user with this email already exists`). |
| 6 | Profile update with valid token returns 200 and updated fields | Passed (200; returned updated name, phone, and address). |
| 7 | Profile request with token changed by one character returns 401 `Invalid or expired token` | Passed (401, exact message). |

## Out of scope

The conversion does not implement `DELETE /profile`, `POST /profile/restore`, `GET /users`, `DELETE /users/:id`, `POST /users/:id/restore`, or the daily purge job.

## Likely defense questions

- **Why do existing password hashes still work?** BCrypt.Net-Next verifies the existing bcrypt format, including the `$2b$` prefix, so the stored hashes need no migration.
- **Why JWT?** The API can validate a signed, expiring bearer token on each request without keeping a server-side login session.
- **Where does the secret live?** The `Jwt:Secret` setting is read from ASP.NET configuration. The checked-in `appsettings.json` contains the development value; deployments should override it through configuration or environment variables.
- **How can other members protect endpoints?** Call `AddForkHubAuth`, then use `[Authorize]` for any logged-in user or `[Authorize(Roles = "admin")]` for admin-only routes; controller code can read `User.GetUserId()`, `GetEmail()`, and `GetRole()`.
