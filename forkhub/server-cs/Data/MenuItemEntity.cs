namespace ForkHub.Api.Data;

// One row in the MenuItems table. Ids stay strings such as "pizza_1".
public class MenuItemEntity
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public string Subcategory { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Image { get; set; } = "";

    // Omitted on most JSON items. Null means the field was not stored.
    public bool? Unavailable { get; set; }

    // Place in the menu list. 0 is the first item from menu.json.
    // The API response does not include this number.
    public int Position { get; set; }
}
