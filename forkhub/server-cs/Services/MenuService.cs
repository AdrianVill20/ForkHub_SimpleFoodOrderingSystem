using System.Text.RegularExpressions;
using ForkHub.Api.Constants;
using ForkHub.Api.Data;
using ForkHub.Api.Models;
using ForkHub.Api.Repositories;

namespace ForkHub.Api.Services;

// Business rules for the menu: who sees what, what a valid item is, how pictures are named
public class MenuService(MenuRepository menu, MenuImageRepository images)
{
    public async Task<List<MenuItem>> GetMenuAsync(string? category)
    {
        var items = await menu.GetAllAsync(category);
        return items.Select(EntityMapping.ToMenuItem).ToList();
    }

    public async Task<MenuItem> GetItemAsync(string id) =>
        EntityMapping.ToMenuItem(await FindOrThrowAsync(id));

    public async Task<MenuItem> CreateAsync(MenuItemRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Category) || request.Price is null)
            throw new HttpError(400, Messages.Menu.RequiredFields);
        EnsureValidPrice(request.Price);

        var item = new MenuItemEntity
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name.Trim(),
            Category = request.Category.Trim(),
            Subcategory = string.IsNullOrEmpty(request.Subcategory) ? MenuRules.DefaultSubcategory : request.Subcategory.Trim(),
            Description = (request.Description ?? "").Trim(),
            Price = request.Price.Value,
            Image = (request.Image ?? "").Trim(),
            Position = await menu.GetNextPositionAsync(),
        };

        await menu.AddAsync(item);
        return EntityMapping.ToMenuItem(item);
    }

    // Changes only the fields that were sent, e.g. { "unavailable": true } from the Unavailable button
    public async Task<MenuItem> UpdateAsync(string id, MenuItemRequest request)
    {
        if (request.Name is not null && request.Name.Trim() == "") throw new HttpError(400, Messages.Menu.NameEmpty);
        if (request.Category is not null && request.Category.Trim() == "") throw new HttpError(400, Messages.Menu.CategoryEmpty);
        EnsureValidPrice(request.Price);

        var item = await FindOrThrowAsync(id);
        if (request.Name is not null) item.Name = request.Name.Trim();
        if (request.Category is not null) item.Category = request.Category.Trim();
        if (request.Subcategory is not null) item.Subcategory = request.Subcategory.Trim();
        if (request.Description is not null) item.Description = request.Description.Trim();
        if (request.Price is not null) item.Price = request.Price.Value;
        if (request.Image is not null) item.Image = request.Image.Trim();
        if (request.Unavailable is not null) item.Unavailable = request.Unavailable;

        await menu.SaveChangesAsync();
        return EntityMapping.ToMenuItem(item);
    }

    // Deletes the item, and its picture when no other item uses it. Returns the deleted item's name.
    public async Task<string> DeleteAsync(string id)
    {
        var item = await FindOrThrowAsync(id);
        await menu.RemoveAsync(item);

        if (!await menu.IsImageUsedAsync(item.Image))
            images.Delete(item.Image);
        return item.Name;
    }

    // Saves an uploaded picture into public/images/{category folder}/ and returns its web path
    public async Task<string> UploadImageAsync(IFormFile? file, string? category)
    {
        if (file is null) throw new HttpError(400, Messages.Menu.NoFile);
        if (file.Length > MenuRules.MaxImageBytes) throw new HttpError(400, Messages.Menu.FileTooLarge);

        var originalName = Path.GetFileName(file.FileName);
        var extension = Path.GetExtension(originalName);
        if (!MenuRules.AllowedImageExtensions.Contains(extension)) throw new HttpError(400, Messages.Menu.NotAnImage);

        // "Ham&Cheese.jpg" -> "Ham_Cheese_1795224122159.jpg", so names never clash
        var baseName = Regex.Replace(Path.GetFileNameWithoutExtension(originalName), "[^a-zA-Z0-9_-]", "_");
        var fileName = $"{baseName}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{extension}";

        return await images.SaveAsync(file, CategoryFolder(category), fileName);
    }

    private async Task<MenuItemEntity> FindOrThrowAsync(string id) =>
        await menu.FindAsync(id) ?? throw new HttpError(404, Messages.Menu.NotFound);

    // Shared by add and edit. A missing price (edit) is allowed; a sent one must be above 0.
    private static void EnsureValidPrice(decimal? price)
    {
        if (price <= 0) throw new HttpError(400, Messages.Menu.PriceMustBePositive);
    }

    // "Pizza" -> "pizza", "Rice Meals" -> "rice-meals". Anything that could point outside
    // public/images (like "../") is removed.
    private static string CategoryFolder(string? category)
    {
        var folder = Regex.Replace((category ?? "").Trim().ToLowerInvariant(), @"\s+", "-");
        folder = Regex.Replace(folder, @"[^\p{L}\p{N}&_-]", "");
        return folder == "" ? MenuRules.FallbackImageFolder : folder;
    }
}
