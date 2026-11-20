using System.Globalization;
using System.Text.Json;
using ForkHub.Api.Models;

namespace ForkHub.Api.Data;

// Turns database rows into the same objects the controllers used to read from JSON.
// The website still receives id, firstName, items, branch, and so on.
public static class EntityMapping
{
    // camelCase names, and numbers such as "299" are accepted as decimals.
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static AppUser ToAppUser(UserEntity entity) => new()
    {
        Id = entity.Id,
        Email = entity.Email,
        Password = entity.Password,
        FirstName = entity.FirstName,
        LastName = entity.LastName,
        Phone = entity.Phone,
        Address = entity.Address,
        Role = entity.Role,
        CreatedAt = entity.CreatedAt,
        IsDeleted = entity.IsDeleted,
        DeletedAt = entity.DeletedAt,
        ScheduledDeletionAt = entity.ScheduledDeletionAt,
    };

    public static MenuItem ToMenuItem(MenuItemEntity entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Category = entity.Category,
        Subcategory = entity.Subcategory,
        Description = entity.Description,
        Price = JsonPrice(entity.Price),
        Image = entity.Image,
        // Null means this item has no "unavailable" field, same as most of menu.json.
        Unavailable = entity.Unavailable,
    };

    public static Order ToOrder(OrderEntity entity) => new()
    {
        Id = entity.Id,
        UserId = entity.UserId,
        Status = entity.Status,
        PlacedAt = entity.PlacedAt,
        Items = entity.Items
            .OrderBy(LineIndex)
            .Select(ToItemElement)
            .ToList(),
        Total = JsonPrice(entity.Total),
        ServiceType = entity.ServiceType,
        Address = entity.Address,
        Phone = entity.Phone,
        Branch = ToPointElement(entity.BranchId, entity.BranchName, entity.BranchLat, entity.BranchLng, includeId: true),
        Destination = ToPointElement(null, entity.DestinationName, entity.DestinationLat, entity.DestinationLng, includeId: false),
        CancelledAt = entity.CancelledAt,
        CancelReason = entity.CancelReason,
    };

    // Saves the website's cart lines. The line id is "{orderId}:{position}", same as the importer.
    public static List<OrderItemEntity> ReadItems(string orderId, IEnumerable<JsonElement> items)
    {
        var lines = new List<OrderItemEntity>();
        var index = 0;
        foreach (var item in items)
        {
            var snapshot = item.ValueKind == JsonValueKind.Object
                ? item.Deserialize<OrderLine>(JsonOptions) ?? new OrderLine()
                : new OrderLine();

            lines.Add(new OrderItemEntity
            {
                Id = $"{orderId}:{index}",
                OrderId = orderId,
                ItemId = snapshot.Id ?? "",
                Name = snapshot.Name ?? "",
                Category = snapshot.Category ?? "",
                Subcategory = snapshot.Subcategory ?? "",
                Description = snapshot.Description ?? "",
                Price = JsonPrice(snapshot.Price),
                Image = snapshot.Image ?? "",
                Note = snapshot.Note,
                Quantity = snapshot.Quantity,
            });
            index++;
        }

        return lines;
    }

    public static void ApplyBranch(OrderEntity order, JsonElement? branch)
    {
        var point = ReadPoint(branch);
        order.BranchId = point?.Id;
        order.BranchName = point?.Name;
        order.BranchLat = point?.Lat;
        order.BranchLng = point?.Lng;
    }

    public static void ApplyDestination(OrderEntity order, JsonElement? destination)
    {
        var point = ReadPoint(destination);
        order.DestinationLat = point?.Lat;
        order.DestinationLng = point?.Lng;
        order.DestinationName = point?.Name;
    }

    // SQLite reads 169 back as 169.0. The website prints that number and then adds ".00",
    // so a whole price has to be sent as 169.
    private static decimal JsonPrice(decimal value)
    {
        var whole = decimal.Truncate(value);
        return value == whole ? whole : value;
    }

    private static int LineIndex(OrderItemEntity item)
    {
        var separator = item.Id.LastIndexOf(':');
        if (separator >= 0 &&
            int.TryParse(item.Id[(separator + 1)..], NumberStyles.None, CultureInfo.InvariantCulture, out var index))
        {
            return index;
        }

        return int.MaxValue;
    }

    private static JsonElement ToItemElement(OrderItemEntity item)
    {
        return JsonSerializer.SerializeToElement(new OrderLine
        {
            Id = item.ItemId,
            Name = item.Name,
            Category = item.Category,
            Subcategory = item.Subcategory,
            Description = item.Description,
            Price = JsonPrice(item.Price),
            Image = item.Image,
            Note = item.Note,
            Quantity = item.Quantity,
        }, JsonOptions);
    }

    // A missing branch or destination stays null, so the response has "branch": null.
    private static JsonElement? ToPointElement(string? id, string? name, double? lat, double? lng, bool includeId)
    {
        if (id is null && name is null && lat is null && lng is null)
            return null;

        return includeId
            ? JsonSerializer.SerializeToElement(new BranchPoint(id, name, lat, lng), JsonOptions)
            : JsonSerializer.SerializeToElement(new DestinationPoint(lat, lng, name), JsonOptions);
    }

    private static PointBody? ReadPoint(JsonElement? point)
    {
        if (point is not { ValueKind: JsonValueKind.Object } element)
            return null;

        return element.Deserialize<PointBody>(JsonOptions);
    }

    // Property order matches the objects stored in orders.json.
    private sealed class OrderLine
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

    private sealed record BranchPoint(string? Id, string? Name, double? Lat, double? Lng);

    private sealed record DestinationPoint(double? Lat, double? Lng, string? Name);

    private sealed class PointBody
    {
        public string? Id { get; set; }
        public string? Name { get; set; }
        public double? Lat { get; set; }
        public double? Lng { get; set; }
    }
}
