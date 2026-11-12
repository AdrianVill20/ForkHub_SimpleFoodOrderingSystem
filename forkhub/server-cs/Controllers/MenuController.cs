using System.Text.RegularExpressions;
using ForkHub.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForkHub.Api.Controllers;

// Same routes as server/routes/menu.routes.js
[ApiController]
[Route("api/menu")]
public class MenuController(JsonStore store, IWebHostEnvironment env, IConfiguration config) : ControllerBase
{
    private const string MenuFile = "menu.json";
    private const long MaxImageBytes = 5 * 1024 * 1024;

    // public/images, found the same way as in Program.cs
    private readonly string _imagesDir = Path.GetFullPath(
        Path.Combine(env.ContentRootPath, config["RootDir"] ?? "..", "public", "images"));

    // POST /api/menu/upload  (form fields: category, image)
    [HttpPost("upload")]
    [Authorize]
    public async Task<IActionResult> Upload()
    {
        var form = Request.HasFormContentType ? await Request.ReadFormAsync() : null;
        var file = form?.Files["image"];
        if (file is null) throw new HttpError(400, "No file received");
        if (file.Length > MaxImageBytes) throw new HttpError(400, "File too large");

        // "Pizza" -> "pizza", "Rice Meals" -> "rice-meals"
        var category = CategoryFolder(form!["category"].ToString());
        var dir = Path.Combine(_imagesDir, category);
        Directory.CreateDirectory(dir);

        var originalName = Path.GetFileName(file.FileName);
        var ext = Path.GetExtension(originalName);
        if (ext == "") ext = ".jpg";
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
        var items = await store.ReadAsync<MenuItem>(MenuFile);
        return Ok(string.IsNullOrEmpty(category) ? items : items.Where(i => i.Category == category));
    }

    // GET /api/menu/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var items = await store.ReadAsync<MenuItem>(MenuFile);
        var item = items.Find(i => i.Id == id) ?? throw new HttpError(404, "Menu item not found");
        return Ok(item);
    }

    // POST /api/menu  — add new item
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] MenuItemRequest body)
    {
        if (string.IsNullOrEmpty(body.Name) || string.IsNullOrEmpty(body.Category) || body.Price is null)
            throw new HttpError(400, "name, category and price are required");

        var items = await store.ReadAsync<MenuItem>(MenuFile);
        var newItem = new MenuItem
        {
            Id = Guid.NewGuid().ToString(),
            Name = body.Name.Trim(),
            Category = body.Category.Trim(),
            Subcategory = string.IsNullOrEmpty(body.Subcategory) ? "Classic" : body.Subcategory.Trim(),
            Description = (body.Description ?? "").Trim(),
            Price = body.Price.Value,
            Image = (body.Image ?? "").Trim(),
        };

        items.Add(newItem);
        await store.WriteAsync(MenuFile, items);
        return StatusCode(201, newItem);
    }

    // PUT /api/menu/{id}  — edit existing item, only the fields that were sent
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] MenuItemRequest body)
    {
        var items = await store.ReadAsync<MenuItem>(MenuFile);
        var item = items.Find(i => i.Id == id) ?? throw new HttpError(404, "Menu item not found");

        if (body.Name is not null) item.Name = body.Name.Trim();
        if (body.Category is not null) item.Category = body.Category.Trim();
        if (body.Subcategory is not null) item.Subcategory = body.Subcategory.Trim();
        if (body.Description is not null) item.Description = body.Description.Trim();
        if (body.Price is not null) item.Price = body.Price.Value;
        if (body.Image is not null) item.Image = body.Image.Trim();
        if (body.Unavailable is not null) item.Unavailable = body.Unavailable;

        await store.WriteAsync(MenuFile, items);
        return Ok(item);
    }

    // DELETE /api/menu/{id}
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var items = await store.ReadAsync<MenuItem>(MenuFile);
        var item = items.Find(i => i.Id == id) ?? throw new HttpError(404, "Menu item not found");

        items.Remove(item);
        await store.WriteAsync(MenuFile, items);
        return Ok(new { message = $"\"{item.Name}\" deleted successfully" });
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
