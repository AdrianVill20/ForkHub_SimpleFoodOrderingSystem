namespace ForkHub.Api.Data;

// One row in the Orders table. Ids stay strings such as "FH-8496943-12".
public class OrderEntity
{
    public string Id { get; set; } = "";

    // The customer who placed the order. Stored as text only.
    // Some existing orders point at users who are no longer in users.json,
    // so this is not a foreign key.
    public string UserId { get; set; } = "";

    public string Status { get; set; } = "Pending";
    public string PlacedAt { get; set; } = "";
    public decimal Total { get; set; }
    public string? ServiceType { get; set; }
    public string Address { get; set; } = "";
    public string? Phone { get; set; }

    // branch object from orders.json, flattened into columns.
    public string? BranchId { get; set; }
    public string? BranchName { get; set; }
    public double? BranchLat { get; set; }
    public double? BranchLng { get; set; }

    // destination object from orders.json, flattened into columns.
    public double? DestinationLat { get; set; }
    public double? DestinationLng { get; set; }
    public string? DestinationName { get; set; }

    public string? CancelledAt { get; set; }
    public string? CancelReason { get; set; }

    public List<OrderItemEntity> Items { get; set; } = [];
}
