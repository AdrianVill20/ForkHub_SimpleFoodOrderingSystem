using System.Text.Json;
using System.Text.Json.Serialization;

namespace ForkHub.Api.Models;

public class Order
{
    public string Id { get; set; } = "";
    public string UserId { get; set; } = "";
    public string Status { get; set; } = "Pending";
    public string PlacedAt { get; set; } = "";
    public List<JsonElement> Items { get; set; } = [];
    public decimal Total { get; set; }
    public string? ServiceType { get; set; }
    public string Address { get; set; } = "";
    public string? Phone { get; set; }
    public JsonElement? Branch { get; set; }
    public JsonElement? Destination { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? CancelledAt { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? CancelReason { get; set; }
}

public class PlaceOrderRequest
{
    public List<JsonElement>? Items { get; set; }
    public decimal Total { get; set; }
    public string? ServiceType { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public JsonElement? Branch { get; set; }
    public JsonElement? Destination { get; set; }
}

public class UpdateStatusRequest
{
    public string? Status { get; set; }
    public string? CancelReason { get; set; }
    public string? Reason { get; set; }
}
