
using System.Globalization;
using ForkHub.Api.Models;

namespace ForkHub.Api.Services;

// Automatically remove accounts after 5 days
public sealed class AccountDeletionCleanupService(
    JsonStore store,
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
            var users = await store.ReadAsync<AppUser>("users.json");
            var now = DateTimeOffset.UtcNow;

            var removed = users.RemoveAll(user =>
                user.IsDeleted == true &&
                !string.IsNullOrEmpty(user.ScheduledDeletionAt) &&
                DateTimeOffset.TryParse(
                    user.ScheduledDeletionAt,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal,
                    out var scheduled
                ) &&
                scheduled <= now
            );

            if (removed > 0)
            {
                await store.WriteAsync("users.json", users);

                logger.LogInformation(
                    "[auth] Purged {Count} expired account(s)",
                    removed
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
