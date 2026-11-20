namespace ForkHub.Api.Data;

// One line inside an order. This is a snapshot of what the customer bought.
// Later menu edits must not change these values.
public class OrderItemEntity
{
    // Surrogate key. The JSON item id is not unique across orders
    // (two orders can both contain "pizza_2_Regular"), so it cannot be the primary key.
    public string Id { get; set; } = "";

    public string OrderId { get; set; } = "";

    // The id sent by the website, such as "pizza_2_Regular" or "chicken_1_6 Pieces".
    public string ItemId { get; set; } = "";

    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public string Subcategory { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Image { get; set; } = "";
    public string? Note { get; set; }
    public int Quantity { get; set; }

    public OrderEntity? Order { get; set; }
}
