using System.Text.Json.Serialization;

namespace ForkHub.Api.Models;

public class MenuItem
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public string Subcategory { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Image { get; set; } = "";

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Unavailable { get; set; }
}

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
