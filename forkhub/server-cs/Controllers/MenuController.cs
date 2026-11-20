using System.Text.RegularExpressions;
using ForkHub.Api.Data;
using ForkHub.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ForkHub.Api.Controllers;

// Same routes as server/routes/menu.routes.js
[ApiController]
[Route("api/menu")]
public class MenuController(ForkHubDbContext db, IWebHostEnvironment env, IConfiguration config) : ControllerBase
{
    private const long MaxImageBytes = 5 * 1024 * 1024;

    // Only pictures, so nobody can host e.g. an .html page under /images
    private static readonly HashSet<string> ImageExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".jfif" };

    // public/images, found the same way as in Program.cs
    private readonly string _imagesDir = Path.GetFullPath(
        Path.Combine(env.ContentRootPath, config["RootDir"] ?? "..", "public", "images"));

    // POST /api/menu/upload  (form fields: category, image)
    [HttpPost("upload")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Upload()
    {
        var form = Request.HasFormContentType ? await Request.ReadFormAsync() : null;
        var file = form?.Files["image"];
        if (file is null) throw new HttpError(400, "No file received");
        if (file.Length > MaxImageBytes) throw new HttpError(400, "File too large");

        var originalName = Path.GetFileName(file.FileName);
        var ext = Path.GetExtension(originalName);
        if (!ImageExtensions.Contains(ext)) throw new HttpError(400, "Only image files are allowed.");

        // "Pizza" -> "pizza", "Rice Meals" -> "rice-meals"
        var category = CategoryFolder(form!["category"].ToString());
        var dir = Path.Combine(_imagesDir, category);
        Directory.CreateDirectory(dir);

        var baseName = Regex.Replace(Path.GetFileNameWithoutExtension(originalName), "[^a-zA-Z0-9_-]", "_");
        var fileName = $"{baseName}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{ext}";

        await using (var stream = System.IO.File.Create(Path.Combine(dir, fileName)))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new { path = $"/images/{category}/{fileName}" });
    }

    // GET /api/menu?category=Pizza
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category)
    {
        // Position follows menu.json, then each new item is added at the end.
        var items = await db.MenuItems.AsNoTracking()
            .OrderBy(item => item.Position)
            .ThenBy(item => item.Id)
            .ToListAsync();
        var menu = items.Select(EntityMapping.ToMenuItem).ToList();
        return Ok(string.IsNullOrEmpty(category) ? menu : menu.Where(i => i.Category == category));
    }

    // GET /api/menu/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await db.MenuItems.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id)
            ?? throw new HttpError(404, "Menu item not found");
        return Ok(EntityMapping.ToMenuItem(item));
    }

    // POST /api/menu  — add new item
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] MenuItemRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Name) || string.IsNullOrWhiteSpace(body.Category) || body.Price is null)
            throw new HttpError(400, "name, category and price are required");
        if (body.Price <= 0) throw new HttpError(400, "Price must be greater than 0.");

        var lastPosition = await db.MenuItems.MaxAsync(item => (int?)item.Position) ?? -1;
        var newItem = new MenuItemEntity
        {
            Id = Guid.NewGuid().ToString(),
            Name = body.Name.Trim(),
            Category = body.Category.Trim(),
            Subcategory = string.IsNullOrEmpty(body.Subcategory) ? "Classic" : body.Subcategory.Trim(),
            Description = (body.Description ?? "").Trim(),
            Price = body.Price.Value,
            Image = (body.Image ?? "").Trim(),
            Position = lastPosition + 1,
        };

        db.MenuItems.Add(newItem);
        await db.SaveChangesAsync();
        return StatusCode(201, EntityMapping.ToMenuItem(newItem));
    }

    // PUT /api/menu/{id}  — edit existing item, only the fields that were sent
    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(string id, [FromBody] MenuItemRequest body)
    {
        if (body.Name is not null && body.Name.Trim() == "") throw new HttpError(400, "Name cannot be empty.");
        if (body.Category is not null && body.Category.Trim() == "") throw new HttpError(400, "Category cannot be empty.");
        if (body.Price <= 0) throw new HttpError(400, "Price must be greater than 0.");

        var item = await db.MenuItems.FirstOrDefaultAsync(i => i.Id == id)
            ?? throw new HttpError(404, "Menu item not found");

        if (body.Name is not null) item.Name = body.Name.Trim();
        if (body.Category is not null) item.Category = body.Category.Trim();
        if (body.Subcategory is not null) item.Subcategory = body.Subcategory.Trim();
        if (body.Description is not null) item.Description = body.Description.Trim();
        if (body.Price is not null) item.Price = body.Price.Value;
        if (body.Image is not null) item.Image = body.Image.Trim();
        if (body.Unavailable is not null) item.Unavailable = body.Unavailable;

        await db.SaveChangesAsync();
        return Ok(EntityMapping.ToMenuItem(item));
    }

    // DELETE /api/menu/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(string id)
    {
        var item = await db.MenuItems.FirstOrDefaultAsync(i => i.Id == id)
            ?? throw new HttpError(404, "Menu item not found");

        var image = item.Image;
        var name = item.Name;
        db.MenuItems.Remove(item);
        await db.SaveChangesAsync();
        if (!await db.MenuItems.AnyAsync(other => other.Image == image))
            DeleteImageIfUnused(image);
        return Ok(new { message = $"\"{name}\" deleted successfully" });
    }

    // Removes a deleted item's picture from public/images.
    // The caller already checked that no other item uses this path.
    // Category tiles (images/categories) are never touched.
    private void DeleteImageIfUnused(string image)
    {
        if (!image.StartsWith("/images/")) return;

        var path = Path.GetFullPath(Path.Combine(_imagesDir, image["/images/".Length..]));
        var categoriesDir = Path.Combine(_imagesDir, "categories") + Path.DirectorySeparatorChar;
        if (!path.StartsWith(_imagesDir + Path.DirectorySeparatorChar) || path.StartsWith(categoriesDir)) return;

        try
        {
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
        }
        catch (IOException)
        {
            // The item is already deleted; a leftover picture isn't worth failing the request
        }
    }

    // Lowercase, spaces to dashes (like the Node version), and nothing that could
    // point outside public/images such as "../"
    private static string CategoryFolder(string category)
    {
        var folder = Regex.Replace(category.Trim().ToLowerInvariant(), @"\s+", "-");
        folder = Regex.Replace(folder, @"[^\p{L}\p{N}&_-]", "");
        return folder == "" ? "misc" : folder;
    }
}
