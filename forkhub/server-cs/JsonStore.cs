using System.Text.Encodings.Web;
using System.Text.Json;

namespace ForkHub.Api;

// Reads and saves the JSON files in data/ (users.json, menu.json, orders.json).
// Inject it into a controller and call:
//   var users = await store.ReadAsync<User>("users.json");
//   await store.WriteAsync("users.json", users);
public class JsonStore(string dataDir)
{
    // camelCase keeps the field names the React frontend expects (firstName, createdAt, ...).
    // Relaxed escaping writes "&" and "ñ" as-is, like Node does, instead of &.
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    // One write at a time, so two requests can't overwrite each other's changes
    private readonly SemaphoreSlim _lock = new(1, 1);

    public async Task<List<T>> ReadAsync<T>(string fileName)
    {
        var path = Path.Combine(dataDir, fileName);
        if (!File.Exists(path)) return [];

        try
        {
            await using var stream = File.OpenRead(path);
            return await JsonSerializer.DeserializeAsync<List<T>>(stream, Options) ?? [];
        }
        catch (JsonException)
        {
            throw new HttpError(500, $"{fileName} contains invalid JSON");
        }
    }

    public async Task WriteAsync<T>(string fileName, List<T> items)
    {
        var path = Path.Combine(dataDir, fileName);
        var tempPath = path + ".tmp";

        await _lock.WaitAsync();
        try
        {
            Directory.CreateDirectory(dataDir);
            // Write to a temp file first, then swap it in, so a crash never leaves a half-written file
            await File.WriteAllTextAsync(tempPath, JsonSerializer.Serialize(items, Options) + "\n");
            File.Move(tempPath, path, overwrite: true);
        }
        finally
        {
            _lock.Release();
        }
    }
}
