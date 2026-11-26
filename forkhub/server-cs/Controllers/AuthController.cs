using System.Globalization;
using ForkHub.Api.Auth;
using ForkHub.Api.Data;
using ForkHub.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ForkHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(ForkHubDbContext db, TokenService tokens, IConfiguration configuration) : ControllerBase
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

        if (await db.Users.AnyAsync(user => user.Email == email)) throw new HttpError(409, "A user with this email already exists");
        var adminSecret = configuration["AdminSecret"] ?? "";
        var adminCode = request?.AdminCode?.Trim() ?? "";
        var user = new UserEntity
        {
            Id = Guid.NewGuid().ToString(),
            Email = email,
            Password = BCrypt.Net.BCrypt.HashPassword(password, 10),
            FirstName = request?.FirstName?.Trim() ?? "",
            LastName = request?.LastName?.Trim() ?? "",
            Phone = request?.Phone?.Trim() ?? "",
            Address = request?.Address?.Trim() ?? "",
            Role = !string.IsNullOrEmpty(adminSecret) && adminCode == adminSecret ? "admin" : "customer",
            CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture)
        };
        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsDuplicateEmail(ex))
        {
            throw new HttpError(409, "A user with this email already exists");
        }

        return StatusCode(StatusCodes.Status201Created, new { user = EntityMapping.ToAppUser(user).ToResponse() });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest? request)
    {
        if (string.IsNullOrEmpty(configuration["Jwt:Secret"])) throw new HttpError(500, "JWT secret is not configured");
        var emailInput = request?.Email;
        var password = request?.Password;
        if (string.IsNullOrEmpty(emailInput) || string.IsNullOrEmpty(password)) throw new HttpError(400, "Email and password are required");
        var email = Validators.NormalizeEmail(emailInput);
        var user = await db.Users.FirstOrDefaultAsync(item => item.Email == email);
        if (user is null) throw new HttpError(401, "Invalid email or password");
        if (user.IsDeleted == true && !string.IsNullOrEmpty(user.ScheduledDeletionAt) &&
            DateTimeOffset.TryParse(user.ScheduledDeletionAt, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var scheduled) && scheduled <= DateTimeOffset.UtcNow)
        {
            throw new HttpError(401, "This account has been deleted. Contact an administrator to restore it.");
        }
        if (string.IsNullOrEmpty(user.Password) || !BCrypt.Net.BCrypt.Verify(password, user.Password)) throw new HttpError(401, "Invalid email or password");
        var responseUser = EntityMapping.ToAppUser(user);
        return Ok(new { token = tokens.CreateToken(responseUser), user = responseUser.ToResponse() });
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(item => item.Id == User.GetUserId());
        if (user is null) throw new HttpError(404, "User not found");
        return Ok(new { user = EntityMapping.ToAppUser(user).ToResponse() });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest? request)
    {
        var user = await db.Users.FirstOrDefaultAsync(item => item.Id == User.GetUserId());
        if (user is null) throw new HttpError(404, "User not found");
        user.FirstName = request?.FirstName?.Trim() ?? "";
        user.LastName = request?.LastName?.Trim() ?? "";
        user.Phone = request?.Phone?.Trim() ?? "";
        user.Address = request?.Address?.Trim() ?? "";
        await db.SaveChangesAsync();
        return Ok(new { user = EntityMapping.ToAppUser(user).ToResponse() });
    }

    private const int DeletionGraceDays = 5;

    // DELETE OWN ACCOUNT (5-DAY GRACE PERIOD)
    [Authorize]
    [HttpDelete("profile")]
    public async Task<IActionResult> DeleteProfile()
    {
        var user = await db.Users.FirstOrDefaultAsync(item => item.Id == User.GetUserId());

        if (user is null)
            throw new HttpError(404, "User not found");

        var now = DateTimeOffset.UtcNow;
        var scheduled = now.AddDays(DeletionGraceDays);

        user.IsDeleted = true;
        user.DeletedAt = now.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);
        user.ScheduledDeletionAt = scheduled.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = $"Account marked as deleted. Self-restoration is available for {DeletionGraceDays} days",
            scheduledDeletionAt = user.ScheduledDeletionAt,
            graceDays = DeletionGraceDays
        });
    }

    // RESTORE OWN ACCOUNT
    [Authorize]
    [HttpPost("profile/restore")]
    public async Task<IActionResult> RestoreProfile()
    {
        var user = await db.Users.FirstOrDefaultAsync(item => item.Id == User.GetUserId());

        if (user is null)
            throw new HttpError(404, "User not found");

        ClearDeletion(user);
        await db.SaveChangesAsync();

        return Ok(new
        {
            user = EntityMapping.ToAppUser(user).ToResponse(),
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

        // The oldest account has no createdAt, so it stays first. Newer accounts follow.
        var users = await db.Users.AsNoTracking()
            .OrderBy(user => user.CreatedAt != null)
            .ThenBy(user => user.CreatedAt)
            .ThenBy(user => user.Id)
            .ToListAsync();

        return Ok(users.Select(user => ToAdminResponse(EntityMapping.ToAppUser(user))).ToList());
    }

    // ADMIN - RESTORE USER ACCOUNT
    [Authorize]
    [HttpPost("users/{id}/restore")]
    public async Task<IActionResult> RestoreUser(string id)
    {
        if (!User.IsAdmin())
            throw new HttpError(403, "Admin access required");

        var user = await db.Users.FirstOrDefaultAsync(item => item.Id == id);

        if (user is null)
            throw new HttpError(404, "User not found");

        ClearDeletion(user);
        await db.SaveChangesAsync();

        return Ok(new
        {
            user = ToAdminResponse(EntityMapping.ToAppUser(user)),
            message = "Account restored"
        });
    }

    // HELPER - CLEAR DELETION STATUS
    private static void ClearDeletion(UserEntity user)
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

    // Two register requests for the same email can both pass the first check.
    // The unique email index then rejects the second save. Return 409, same as the first check.
    // SQLite reports this as "UNIQUE constraint failed: Users.Email".
    private static bool IsDuplicateEmail(DbUpdateException exception)
    {
        var message = exception.InnerException?.Message ?? "";
        return message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase)
            && message.Contains("Users.Email", StringComparison.OrdinalIgnoreCase);
    }
}
