using System.Globalization;

namespace ForkHub.Api.Common;

// Dates are stored as text in the same format the old Node backend used (toISOString)
public static class IsoTime
{
    public const string Format = "yyyy-MM-dd'T'HH:mm:ss.fff'Z'";

    // e.g. 2026-05-15T15:21:36.943Z
    public static string Now() => DateTime.UtcNow.ToString(Format, CultureInfo.InvariantCulture);
}
