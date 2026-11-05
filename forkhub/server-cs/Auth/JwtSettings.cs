using System.Globalization;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace ForkHub.Api.Auth;

public sealed class JwtSettings
{
    public string Secret { get; set; } = "";
    public string ExpiresIn { get; set; } = "1h";

    public SymmetricSecurityKey CreateKey()
    {
        if (string.IsNullOrWhiteSpace(Secret)) throw new InvalidOperationException("JWT secret is not configured");
        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secret));
    }

    public TimeSpan GetLifetime()
    {
        var value = ExpiresIn.Trim();
        if (double.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out var seconds) && seconds >= 0)
            return TimeSpan.FromSeconds(seconds);
        if (value.Length < 2 || !double.TryParse(value[..^1], NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var amount) || amount < 0)
            throw new InvalidOperationException("Invalid JWT expiration value");
        var multiplier = char.ToLowerInvariant(value[^1]) switch { 's' => 1d, 'm' => 60d, 'h' => 3600d, 'd' => 86400d, _ => throw new InvalidOperationException("Invalid JWT expiration value") };
        return TimeSpan.FromSeconds(amount * multiplier);
    }
}
