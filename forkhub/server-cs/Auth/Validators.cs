using System.Text.RegularExpressions;

namespace ForkHub.Api.Auth;

public static partial class Validators
{
    public const int MinimumPasswordLength = 8;
    [GeneratedRegex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")]
    private static partial Regex EmailRegex();
    public static bool ValidateEmail(string email) => EmailRegex().IsMatch(email);
    public static bool ValidatePassword(string password) => password.Length >= MinimumPasswordLength;
    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
