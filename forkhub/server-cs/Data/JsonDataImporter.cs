using System.Text.Json;
using ForkHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ForkHub.Api.Data;

// Copies users.json, menu.json, and orders.json into SQLite.
// It only reads the JSON files. Rows that already have the same id are left alone,
// so starting the API again does not insert duplicates.
public class JsonDataImporter(ForkHubDbContext db, JsonStore store)
{
    public async Task<ImportCounts> ImportAsync(CancellationToken cancellationToken = default)
    {
        var users = await ImportUsersAsync(cancellationToken);
        var menuItems = await ImportMenuItemsAsync(cancellationToken);
        var orders = await ImportOrdersAsync(cancellationToken);

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new ImportCounts(users, menuItems, orders);
    }

    private async Task<TableCounts> ImportUsersAsync(CancellationToken cancellationToken)
    {
        var existingIds = await db.Users.AsNoTracking()
            .Select(user => user.Id)
            .ToListAsync(cancellationToken);
        var knownIds = existingIds.ToHashSet(StringComparer.Ordinal);
        var added = 0;
        var skipped = 0;

        foreach (var user in await store.ReadAsync<AppUser>("users.json"))
        {
            if (string.IsNullOrWhiteSpace(user.Id) || !knownIds.Add(user.Id))
            {
                skipped++;
                continue;
            }

            db.Users.Add(new UserEntity
            {
                Id = user.Id,
                Email = user.Email ?? "",
                // Stored exactly as bcrypt wrote it, including the $2a$ or $2b$ prefix.
                Password = user.Password ?? "",
                FirstName = user.FirstName ?? "",
                LastName = user.LastName ?? "",
                Phone = user.Phone ?? "",
                Address = user.Address ?? "",
                Role = user.Role ?? "customer",
                CreatedAt = user.CreatedAt,
                IsDeleted = user.IsDeleted,
                DeletedAt = user.DeletedAt,
                ScheduledDeletionAt = user.ScheduledDeletionAt,
            });
            added++;
        }

        return new TableCounts(added, skipped);
    }

    private async Task<TableCounts> ImportMenuItemsAsync(CancellationToken cancellationToken)
    {
        var existingIds = await db.MenuItems.AsNoTracking()
            .Select(item => item.Id)
            .ToListAsync(cancellationToken);
        var knownIds = existingIds.ToHashSet(StringComparer.Ordinal);
        var added = 0;
        var skipped = 0;

        foreach (var item in await store.ReadAsync<MenuItem>("menu.json"))
        {
            if (string.IsNullOrWhiteSpace(item.Id) || !knownIds.Add(item.Id))
            {
                skipped++;
                continue;
            }

            db.MenuItems.Add(new MenuItemEntity
            {
                Id = item.Id,
                Name = item.Name ?? "",
                Category = item.Category ?? "",
                Subcategory = item.Subcategory ?? "",
                Description = item.Description ?? "",
                Price = item.Price,
                Image = item.Image ?? "",
                // Null means the JSON object did not contain "unavailable".
                Unavailable = item.Unavailable,
            });
            added++;
        }

        return new TableCounts(added, skipped);
    }

    private async Task<OrderImportCounts> ImportOrdersAsync(CancellationToken cancellationToken)
    {
        var existingOrderIds = await db.Orders.AsNoTracking()
            .Select(order => order.Id)
            .ToListAsync(cancellationToken);
        var knownOrderIds = existingOrderIds.ToHashSet(StringComparer.Ordinal);
        var existingItemIds = await db.OrderItems.AsNoTracking()
            .Select(item => item.Id)
            .ToListAsync(cancellationToken);
        var knownItemIds = existingItemIds.ToHashSet(StringComparer.Ordinal);

        var ordersAdded = 0;
        var ordersSkipped = 0;
        var itemsAdded = 0;
        var itemsSkipped = 0;

        foreach (var order in await store.ReadAsync<Order>("orders.json"))
        {
            if (string.IsNullOrWhiteSpace(order.Id) || !knownOrderIds.Add(order.Id))
            {
                ordersSkipped++;
                itemsSkipped += order.Items.Count;
                continue;
            }

            var (branchId, branchName, branchLat, branchLng) = ReadPoint(order.Branch, includeId: true);
            var (_, destinationName, destinationLat, destinationLng) = ReadPoint(order.Destination, includeId: false);

            var entity = new OrderEntity
            {
                Id = order.Id,
                // Text only. Orders whose customer is gone from users.json are still stored.
                UserId = order.UserId ?? "",
                Status = string.IsNullOrWhiteSpace(order.Status) ? "Pending" : order.Status,
                PlacedAt = order.PlacedAt ?? "",
                Total = order.Total,
                ServiceType = order.ServiceType,
                Address = order.Address ?? "",
                Phone = order.Phone,
                BranchId = branchId,
                BranchName = branchName,
                BranchLat = branchLat,
                BranchLng = branchLng,
                DestinationLat = destinationLat,
                DestinationLng = destinationLng,
                DestinationName = destinationName,
                CancelledAt = order.CancelledAt,
                CancelReason = order.CancelReason,
            };

            for (var index = 0; index < order.Items.Count; index++)
            {
                // The same menu choice can appear on many orders, so the line needs its own id.
                // The id is derived from the order id and position, which keeps a second import stable.
                var lineId = $"{order.Id}:{index}";
                if (!knownItemIds.Add(lineId))
                {
                    itemsSkipped++;
                    continue;
                }

                var snapshot = order.Items[index].Deserialize<OrderItemSnapshot>(JsonStore.Options) ?? new OrderItemSnapshot();
                entity.Items.Add(new OrderItemEntity
                {
                    Id = lineId,
                    OrderId = order.Id,
                    ItemId = snapshot.Id ?? "",
                    Name = snapshot.Name ?? "",
                    Category = snapshot.Category ?? "",
                    Subcategory = snapshot.Subcategory ?? "",
                    Description = snapshot.Description ?? "",
                    Price = snapshot.Price,
                    Image = snapshot.Image ?? "",
                    Note = snapshot.Note,
                    Quantity = snapshot.Quantity,
                });
                itemsAdded++;
            }

            db.Orders.Add(entity);
            ordersAdded++;
        }

        return new OrderImportCounts(ordersAdded, ordersSkipped, itemsAdded, itemsSkipped);
    }

    private static (string? Id, string? Name, double? Lat, double? Lng) ReadPoint(JsonElement? point, bool includeId)
    {
        if (point is not { ValueKind: JsonValueKind.Object } element)
            return (null, null, null, null);

        return (
            includeId ? ReadString(element, "id") : null,
            ReadString(element, "name"),
            ReadDouble(element, "lat"),
            ReadDouble(element, "lng"));
    }

    private static string? ReadString(JsonElement element, string name)
    {
        if (!element.TryGetProperty(name, out var value) || value.ValueKind != JsonValueKind.String)
            return null;
        return value.GetString();
    }

    private static double? ReadDouble(JsonElement element, string name)
    {
        if (!element.TryGetProperty(name, out var value))
            return null;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetDouble(out var number))
            return number;
        return null;
    }

    // Shape of one object inside an order's items array.
    private sealed class OrderItemSnapshot
    {
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? Category { get; set; }
        public string? Subcategory { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? Image { get; set; }
        public string? Note { get; set; }
        public int Quantity { get; set; }
    }
}

public sealed record TableCounts(int Added, int Skipped);

public sealed record OrderImportCounts(int OrdersAdded, int OrdersSkipped, int ItemsAdded, int ItemsSkipped);

public sealed record ImportCounts(TableCounts Users, TableCounts MenuItems, OrderImportCounts Orders);
