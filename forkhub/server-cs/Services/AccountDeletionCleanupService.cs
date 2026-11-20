using System.Globalization;
using ForkHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ForkHub.Api.Services;

// Automatically remove accounts after 5 days.
// This service lives for the whole time the API is running, so it opens a fresh
// database connection for each check. A controller gets its own connection per request.
public sealed class AccountDeletionCleanupService(
    IServiceScopeFactory scopes,
    ILogger<AccountDeletionCleanupService> logger
) : BackgroundService
{
    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        // Check expired accounts when the server starts
        await PurgeAsync(stoppingToken);

        // Check again every 24 hours
        using var timer = new PeriodicTimer(TimeSpan.FromDays(1));

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await PurgeAsync(stoppingToken);
        }
    }

    private async Task PurgeAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var scope = scopes.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ForkHubDbContext>();
            var now = DateTimeOffset.UtcNow;
            var users = await db.Users.ToListAsync(cancellationToken);

            var expired = users.Where(user =>
                user.IsDeleted == true &&
                !string.IsNullOrEmpty(user.ScheduledDeletionAt) &&
                DateTimeOffset.TryParse(
                    user.ScheduledDeletionAt,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal,
                    out var scheduled
                ) &&
                scheduled <= now
            ).ToList();

            if (expired.Count > 0)
            {
                db.Users.RemoveRange(expired);
                await db.SaveChangesAsync(cancellationToken);

                logger.LogInformation(
                    "[auth] Purged {Count} expired account(s)",
                    expired.Count
                );
            }
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to purge expired accounts");
        }
    }
}
