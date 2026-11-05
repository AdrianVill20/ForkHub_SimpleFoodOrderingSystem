using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using ForkHub.Api.Models;

namespace ForkHub.Api.Auth;

public sealed class TokenService(JwtSettings settings)
{
    public string CreateToken(AppUser user)
    {
        var now = DateTime.UtcNow;
        var expiry = now.Add(settings.GetLifetime());
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id ?? ""),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new Claim("role", string.IsNullOrEmpty(user.Role) ? "customer" : user.Role),
            new Claim(JwtRegisteredClaimNames.Iat, new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
        };
        var token = new JwtSecurityToken(new JwtHeader(new Microsoft.IdentityModel.Tokens.SigningCredentials(settings.CreateKey(), Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256)),
            new JwtPayload(claims) { [JwtRegisteredClaimNames.Exp] = new DateTimeOffset(expiry).ToUnixTimeSeconds() });
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
