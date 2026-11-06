using System.Text.Json;
using System.Text.Json.Serialization;

namespace ForkHub.Api.Models;

// One food item in data/menu.json
public class MenuItem
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public string Subcategory { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Image { get; set; } = "";

    // Most items don't have this field, so leave it out of the file unless it's set
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Unavailable { get; set; }

    // Keeps any extra fields in menu.json so saving never drops them
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? Extra { get; set; }
}

// Body of POST and PUT /api/menu. Missing fields are null, so PUT only changes what was sent.
public class MenuItemRequest
{
    public string? Name { get; set; }
    public string? Category { get; set; }
    public string? Subcategory { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public string? Image { get; set; }
    public bool? Unavailable { get; set; }
}
