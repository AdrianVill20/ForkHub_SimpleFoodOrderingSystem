namespace ForkHub.Api.Constants;

// Fixed values for menu items and their pictures
public static class MenuRules
{
    public const string DefaultSubcategory = "Classic";

    public const long MaxImageBytes = 5 * 1024 * 1024;   // 5 MB

    // Only pictures, so nobody can host e.g. an .html page under /images
    public static readonly IReadOnlySet<string> AllowedImageExtensions =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".jfif" };

    // Picture paths start with this, e.g. /images/pizza/CheeseMania.jpg
    public const string ImagesUrlPrefix = "/images/";

    // Folder of the category tiles on the menu page; never deleted with a food item
    public const string CategoryTilesFolder = "categories";

    // Used when the upload has no usable category name
    public const string FallbackImageFolder = "misc";
}
