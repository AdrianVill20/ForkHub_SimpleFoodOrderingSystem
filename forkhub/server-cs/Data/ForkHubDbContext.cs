using Microsoft.EntityFrameworkCore;

namespace ForkHub.Api.Data;

// The database context is the class EF Core uses to talk to SQLite.
// Auth, menu, and orders controllers read and write these tables.
public class ForkHubDbContext(DbContextOptions<ForkHubDbContext> options) : DbContext(options)
{
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<MenuItemEntity> MenuItems => Set<MenuItemEntity>();
    public DbSet<OrderEntity> Orders => Set<OrderEntity>();
    public DbSet<OrderItemEntity> OrderItems => Set<OrderItemEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Cart and CartItems are not mapped. The website stores the cart in browser localStorage.

        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Id).ValueGeneratedNever();
            entity.HasIndex(user => user.Email).IsUnique();
            entity.Property(user => user.Email).IsRequired();
            entity.Property(user => user.Password).IsRequired();
        });

        modelBuilder.Entity<MenuItemEntity>(entity =>
        {
            entity.ToTable("MenuItems");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).ValueGeneratedNever();
            entity.Property(item => item.Price).HasPrecision(18, 2);
            entity.Property(item => item.Position).HasDefaultValue(0);
        });

        modelBuilder.Entity<OrderEntity>(entity =>
        {
            entity.ToTable("Orders");
            entity.HasKey(order => order.Id);
            entity.Property(order => order.Id).ValueGeneratedNever();
            entity.Property(order => order.Total).HasPrecision(18, 2);
            entity.HasIndex(order => order.UserId);
            // UserId is intentionally not a foreign key. Orders can outlive deleted accounts.
        });

        modelBuilder.Entity<OrderItemEntity>(entity =>
        {
            entity.ToTable("OrderItems");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).ValueGeneratedNever();
            entity.Property(item => item.Price).HasPrecision(18, 2);

            entity.HasOne(item => item.Order)
                .WithMany(order => order.Items)
                .HasForeignKey(item => item.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
