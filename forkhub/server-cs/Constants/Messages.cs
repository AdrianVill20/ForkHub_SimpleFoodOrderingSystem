namespace ForkHub.Api.Constants;

// Texts sent to the website as { "message": "..." }. The website shows them to the user.
public static class Messages
{
    public static class Menu
    {
        public const string NotFound = "Menu item not found";
        public const string RequiredFields = "name, category and price are required";
        public const string PriceMustBePositive = "Price must be greater than 0.";
        public const string NameEmpty = "Name cannot be empty.";
        public const string CategoryEmpty = "Category cannot be empty.";
        public const string NoFile = "No file received";
        public const string FileTooLarge = "File too large";
        public const string NotAnImage = "Only image files are allowed.";

        public static string Deleted(string name) => $"\"{name}\" deleted successfully";
    }

    public static class Orders
    {
        public const string NotFound = "Order not found";
        public const string CartEmpty = "Cart is empty";
        public const string PhoneRequired = "Phone is required";
        public const string AddressRequired = "Address is required";
        public const string StatusRequired = "Status is required";
        public const string InvalidStatus = "Invalid order status";
        public const string AdminOnly = "Admin only";
        public const string AdminCannotOrder = "Admins cannot place orders.";
        public const string CancelOnlyWhilePending = "You can only cancel an order while it is Pending.";
        public const string Deleted = "Order deleted";
    }
}
