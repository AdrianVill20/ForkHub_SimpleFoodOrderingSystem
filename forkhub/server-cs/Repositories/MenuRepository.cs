using ForkHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ForkHub.Api.Repositories;

// All database reads and writes for the MenuItems table
public class MenuRepository(ForkHubDbContext db)
{
    // Menu order: original menu first, then each new item at the end. No category = everything.
    public Task<List<MenuItemEntity>> GetAllAsync(string? category = null)
    {
        var query = db.MenuItems.AsNoTracking();
        if (!string.IsNullOrEmpty(category))
            query = query.Where(item => item.Category == category);

        return query.OrderBy(item => item.Position).ThenBy(item => item.Id).ToListAsync();
    }

    public Task<MenuItemEntity?> FindAsync(string id) =>
        db.MenuItems.FirstOrDefaultAsync(item => item.Id == id);

    // Position for a new item, so it goes after every existing one
    public async Task<int> GetNextPositionAsync() =>
        (await db.MenuItems.MaxAsync(item => (int?)item.Position) ?? -1) + 1;

    public Task<bool> IsImageUsedAsync(string image) =>
        db.MenuItems.AnyAsync(item => item.Image == image);

    public async Task AddAsync(MenuItemEntity item)
    {
        db.MenuItems.Add(item);
        await db.SaveChangesAsync();
    }

    // Saves changes made to items loaded with FindAsync
    public Task SaveChangesAsync() => db.SaveChangesAsync();

    public async Task RemoveAsync(MenuItemEntity item)
    {
        db.MenuItems.Remove(item);
        await db.SaveChangesAsync();
    }
}
