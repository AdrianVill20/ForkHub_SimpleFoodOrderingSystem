using ForkHub.Api.Constants;

namespace ForkHub.Api.Repositories;

// Saves and deletes the food picture files in public/images
public class MenuImageRepository(IWebHostEnvironment env, IConfiguration config)
{
    // public/images, found the same way as in Program.cs
    private readonly string _imagesDir = Path.GetFullPath(
        Path.Combine(env.ContentRootPath, config["RootDir"] ?? "..", "public", "images"));

    // Saves the file as public/images/{folder}/{fileName} and returns its web path
    public async Task<string> SaveAsync(IFormFile file, string folder, string fileName)
    {
        var dir = Path.Combine(_imagesDir, folder);
        Directory.CreateDirectory(dir);

        await using (var stream = File.Create(Path.Combine(dir, fileName)))
        {
            await file.CopyToAsync(stream);
        }

        return $"{MenuRules.ImagesUrlPrefix}{folder}/{fileName}";
    }

    // Deletes a picture by its web path. Never touches anything outside public/images
    // or the category tiles, even if a path points there.
    public void Delete(string imagePath)
    {
        if (!imagePath.StartsWith(MenuRules.ImagesUrlPrefix)) return;

        var path = Path.GetFullPath(Path.Combine(_imagesDir, imagePath[MenuRules.ImagesUrlPrefix.Length..]));
        var tilesDir = Path.Combine(_imagesDir, MenuRules.CategoryTilesFolder) + Path.DirectorySeparatorChar;
        if (!path.StartsWith(_imagesDir + Path.DirectorySeparatorChar) || path.StartsWith(tilesDir)) return;

        try
        {
            if (File.Exists(path)) File.Delete(path);
        }
        catch (IOException)
        {
            // The item is already deleted; a leftover picture isn't worth failing the request
        }
    }
}
