namespace ForkHub.Api.Constants;

// Every status an order can have. The website shows and sends these exact texts (src/constants/index.js).
public static class OrderStatuses
{
    public const string Pending = "Pending";
    public const string Preparing = "Preparing";
    public const string OutForDelivery = "Out for delivery";
    public const string ReadyForPickup = "Ready for pickup";
    public const string Delivered = "Delivered";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";

    public static readonly IReadOnlyList<string> All =
        [Pending, Preparing, OutForDelivery, ReadyForPickup, Delivered, Completed, Cancelled];
}
