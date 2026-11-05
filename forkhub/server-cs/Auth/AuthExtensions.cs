using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

// Usage: [Authorize], User.GetUserId(), [Authorize(Roles = "admin")]
namespace ForkHub.Api.Auth;

public static class AuthExtensions
{
    public static IServiceCollection AddForkHubAuth(this IServiceCollection services, IConfiguration configuration)
    {
        var settings = configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
        services.AddSingleton(settings);
        services.AddSingleton<TokenService>();
        services.AddAuthorization();
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
        {
            options.MapInboundClaims = false;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = false, ValidateAudience = false, ValidateIssuerSigningKey = true,
                IssuerSigningKey = settings.CreateKey(), ValidateLifetime = true, ClockSkew = TimeSpan.Zero,
                NameClaimType = "sub", RoleClaimType = "role"
            };
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var header = context.Request.Headers.Authorization.ToString();
                    var parts = header.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length != 2 || !string.Equals(parts[0], "Bearer", StringComparison.Ordinal))
                        context.HttpContext.Items["ForkHubAuthMalformed"] = true;
                    return Task.CompletedTask;
                },
                OnChallenge = async context =>
                {
                    context.HandleResponse();
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    var malformed = context.HttpContext.Items.ContainsKey("ForkHubAuthMalformed");
                    await context.Response.WriteAsJsonAsync(new { message = malformed ? "Missing or invalid authorization token" : "Invalid or expired token" });
                },
                OnForbidden = async context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new { message = "Access denied" });
                }
            };
        });
        return services;
    }

    public static string? GetUserId(this ClaimsPrincipal user) => user.FindFirstValue("sub");
    public static string? GetEmail(this ClaimsPrincipal user) => user.FindFirstValue(JwtRegisteredClaimNames.Email);
    public static string GetRole(this ClaimsPrincipal user) => user.FindFirstValue("role") ?? "customer";
    public static bool IsAdmin(this ClaimsPrincipal user) => string.Equals(user.GetRole(), "admin", StringComparison.Ordinal);
}
