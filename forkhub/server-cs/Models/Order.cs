using System.Text.Json;
using System.Text.Json.Serialization;

namespace ForkHub.Api.Models;

// One order in data/orders.json
public class Order
{
    public string Id { get; set; } = "";
    public string UserId { get; set; } = "";
    public string Status { get; set; } = "Pending";
    public string PlacedAt { get; set; } = "";

    // Cart items saved exactly as the website sent them (name, price, quantity, note, ...)
    public List<JsonElement> Items { get; set; } = [];

    public decimal Total { get; set; }
    public string? ServiceType { get; set; }
    public string Address { get; set; } = "";
    public string? Phone { get; set; }
    public JsonElement? Branch { get; set; }
    public JsonElement? Destination { get; set; }

    // Only set when the order is cancelled
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? CancelledAt { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? CancelReason { get; set; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement>? Extra { get; set; }
}

// Body of POST /api/orders
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

// Body of PUT /api/orders/{id}/status. The website sends the cancel reason as "reason".
public class UpdateStatusRequest
{
    public string? Status { get; set; }
    public string? CancelReason { get; set; }
    public string? Reason { get; set; }
}
