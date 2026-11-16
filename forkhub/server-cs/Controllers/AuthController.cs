using System.Globalization;
using ForkHub.Api.Auth;
using ForkHub.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForkHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(JsonStore store, TokenService tokens, IConfiguration configuration) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest? request)
    {
        var emailInput = request?.Email;
        var password = request?.Password;
        if (string.IsNullOrEmpty(emailInput) || string.IsNullOrEmpty(password)) throw new HttpError(400, "Email and password are required");
        var email = Validators.NormalizeEmail(emailInput);
        if (!Validators.ValidateEmail(email)) throw new HttpError(400, "Invalid email format");
        if (!Validators.ValidatePassword(password)) throw new HttpError(400, $"Password must be at least {Validators.MinimumPasswordLength} characters long");

        var users = await store.ReadAsync<AppUser>("users.json");
        if (users.Any(user => user.Email == email)) throw new HttpError(409, "A user with this email already exists");
        var adminSecret = configuration["AdminSecret"] ?? "";
        var adminCode = request?.AdminCode?.Trim() ?? "";
        var user = new AppUser
        {
            Id = Guid.NewGuid().ToString(), Email = email, Password = BCrypt.Net.BCrypt.HashPassword(password, 10),
            FirstName = request?.FirstName?.Trim() ?? "", LastName = request?.LastName?.Trim() ?? "",
            Phone = request?.Phone?.Trim() ?? "", Address = request?.Address?.Trim() ?? "",
            Role = !string.IsNullOrEmpty(adminSecret) && adminCode == adminSecret ? "admin" : "customer",
            CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture)
        };
        users.Add(user);
        await store.WriteAsync("users.json", users);
        return StatusCode(StatusCodes.Status201Created, new { user = user.ToResponse() });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest? request)
    {
        if (string.IsNullOrEmpty(configuration["Jwt:Secret"])) throw new HttpError(500, "JWT secret is not configured");
        var emailInput = request?.Email;
        var password = request?.Password;
        if (string.IsNullOrEmpty(emailInput) || string.IsNullOrEmpty(password)) throw new HttpError(400, "Email and password are required");
        var email = Validators.NormalizeEmail(emailInput);
        var users = await store.ReadAsync<AppUser>("users.json");
        var user = users.FirstOrDefault(item => item.Email == email);
        if (user is null) throw new HttpError(401, "Invalid email or password");
        if (user.IsDeleted == true && !string.IsNullOrEmpty(user.ScheduledDeletionAt) &&
            DateTimeOffset.TryParse(user.ScheduledDeletionAt, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var scheduled) && scheduled <= DateTimeOffset.UtcNow)
        {
            users.RemoveAll(item => item.Id == user.Id);
            await store.WriteAsync("users.json", users);
            throw new HttpError(401, "This account has been permanently deleted");
        }
        if (string.IsNullOrEmpty(user.Password) || !BCrypt.Net.BCrypt.Verify(password, user.Password)) throw new HttpError(401, "Invalid email or password");
        return Ok(new { token = tokens.CreateToken(user), user = user.ToResponse() });
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var users = await store.ReadAsync<AppUser>("users.json");
        var user = users.FirstOrDefault(item => item.Id == User.GetUserId());
        if (user is null) throw new HttpError(404, "User not found");
        return Ok(new { user = user.ToResponse() });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest? request)
    {
        var users = await store.ReadAsync<AppUser>("users.json");
        var index = users.FindIndex(item => item.Id == User.GetUserId());
        if (index < 0) throw new HttpError(404, "User not found");
        var user = users[index];
        user.FirstName = request?.FirstName?.Trim() ?? "";
        user.LastName = request?.LastName?.Trim() ?? "";
        user.Phone = request?.Phone?.Trim() ?? "";
        user.Address = request?.Address?.Trim() ?? "";
        await store.WriteAsync("users.json", users);
        return Ok(new { user = user.ToResponse() });
    }

    private const int DeletionGraceDays = 5;

                            // DELETE OWN ACCOUNT (5-DAY GRACE PERIOD)
    [Authorize]
    [HttpDelete("profile")]
    public async Task<IActionResult> DeleteProfile()
    {
        var users = await store.ReadAsync<AppUser>("users.json");
        var user = users.FirstOrDefault(item => item.Id == User.GetUserId());

        if (user is null)
            throw new HttpError(404, "User not found");

        var now = DateTimeOffset.UtcNow;
        var scheduled = now.AddDays(DeletionGraceDays);

        user.IsDeleted = true;
        user.DeletedAt = now.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);
        user.ScheduledDeletionAt = scheduled.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);

        await store.WriteAsync("users.json", users);

        return Ok(new
        {
            message = $"Account scheduled for permanent deletion in {DeletionGraceDays} days",
            scheduledDeletionAt = user.ScheduledDeletionAt,
            graceDays = DeletionGraceDays
        });
    }

    // RESTORE OWN ACCOUNT
    [Authorize]
    [HttpPost("profile/restore")]
    public async Task<IActionResult> RestoreProfile()
    {
        var users = await store.ReadAsync<AppUser>("users.json");
        var user = users.FirstOrDefault(item => item.Id == User.GetUserId());

        if (user is null)
            throw new HttpError(404, "User not found");

        ClearDeletion(user);
        await store.WriteAsync("users.json", users);

        return Ok(new
        {
            user = user.ToResponse(),
            message = "Account deletion cancelled"
        });
    }

    // ADMIN - VIEW ALL USERS
    [Authorize]
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        if (!User.IsAdmin())
            throw new HttpError(403, "Access denied");

        var users = await store.ReadAsync<AppUser>("users.json");

        return Ok(users.Select(ToAdminResponse).ToList());
    }

    // ADMIN - PERMANENTLY DELETE USER
    [Authorize]
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        if (!User.IsAdmin())
            throw new HttpError(403, "Admin access required");

        var users = await store.ReadAsync<AppUser>("users.json");
        var target = users.FirstOrDefault(item => item.Id == id);

        if (target is null)
            throw new HttpError(404, "User not found");

        if (target.Role == "admin")
            throw new HttpError(403, "Cannot delete admin accounts");

        users.RemoveAll(item => item.Id == id);
        await store.WriteAsync("users.json", users);

        return Ok(new
        {
            message = $"Account \"{target.Email}\" permanently deleted"
        });
    }

    // ADMIN - RESTORE USER ACCOUNT
    [Authorize]
    [HttpPost("users/{id}/restore")]
    public async Task<IActionResult> RestoreUser(string id)
    {
        if (!User.IsAdmin())
            throw new HttpError(403, "Admin access required");

        var users = await store.ReadAsync<AppUser>("users.json");
        var user = users.FirstOrDefault(item => item.Id == id);

        if (user is null)
            throw new HttpError(404, "User not found");

        ClearDeletion(user);
        await store.WriteAsync("users.json", users);

        return Ok(new
        {
            user = ToAdminResponse(user),
            message = "Account restored"
        });
    }

    // HELPER - CLEAR DELETION STATUS
    private static void ClearDeletion(AppUser user)
    {
        user.IsDeleted = null;
        user.DeletedAt = null;
        user.ScheduledDeletionAt = null;
    }

    // HELPER - ADMIN USER RESPONSE
    private static Dictionary<string, object?> ToAdminResponse(AppUser user)
    {
        var result = new Dictionary<string, object?>
        {
            ["id"] = user.Id,
            ["email"] = user.Email,
            ["firstName"] = user.FirstName ?? "",
            ["lastName"] = user.LastName ?? "",
            ["phone"] = user.Phone ?? "",
            ["address"] = user.Address ?? "",
            ["role"] = user.Role ?? "customer",
            ["isDeleted"] = user.IsDeleted ?? false,
            ["scheduledDeletionAt"] = user.ScheduledDeletionAt,
            ["deletedAt"] = user.DeletedAt
        };

        if (user.CreatedAt is not null)
            result["createdAt"] = user.CreatedAt;

        return result;
    }

}
