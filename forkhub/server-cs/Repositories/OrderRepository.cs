using ForkHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ForkHub.Api.Repositories;

// All database reads and writes for the Orders and OrderItems tables
public class OrderRepository(ForkHubDbContext db)
{
    // Orders with their items, oldest first. With a userId, only that customer's orders.
    public Task<List<OrderEntity>> GetAllAsync(string? userId = null)
    {
        var query = db.Orders.AsNoTracking().Include(order => order.Items).AsQueryable();
        if (userId is not null)
            query = query.Where(order => order.UserId == userId);

        return query.OrderBy(order => order.PlacedAt).ThenBy(order => order.Id).ToListAsync();
    }

    // Order with its items. Changes to it are saved by SaveChangesAsync.
    public Task<OrderEntity?> FindAsync(string id) =>
        db.Orders.Include(order => order.Items).FirstOrDefaultAsync(order => order.Id == id);

    // Oldest order whose id or phone matches (search is already lowercase and trimmed)
    public Task<OrderEntity?> FindByIdOrPhoneAsync(string search) =>
        db.Orders.AsNoTracking()
            .Include(order => order.Items)
            .Where(order => order.Id.ToLower() == search || (order.Phone ?? "").ToLower() == search)
            .OrderBy(order => order.PlacedAt).ThenBy(order => order.Id)
            .FirstOrDefaultAsync();

    public async Task AddAsync(OrderEntity order)
    {
        db.Orders.Add(order);
        await db.SaveChangesAsync();
    }

    public Task SaveChangesAsync() => db.SaveChangesAsync();

    // Its OrderItems are deleted too (cascade delete in ForkHubDbContext)
    public async Task RemoveAsync(OrderEntity order)
    {
        db.Orders.Remove(order);
        await db.SaveChangesAsync();
    }
}
