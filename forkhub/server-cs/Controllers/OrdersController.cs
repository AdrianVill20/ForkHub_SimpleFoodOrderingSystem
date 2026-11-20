using System.Globalization;
using ForkHub.Api.Auth;
using ForkHub.Api.Data;
using ForkHub.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ForkHub.Api.Controllers;

// Same routes as server/routes/order.routes.js
[ApiController]
[Route("api/orders")]
public class OrdersController(ForkHubDbContext db) : ControllerBase
{
    // GET /api/orders  — admin gets all, customer gets their own
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll()
    {
        var orders = await LoadOrdersAsync();
        return Ok(User.IsAdmin() ? orders : orders.Where(o => o.UserId == User.GetUserId()));
    }

    // GET /api/orders/track?q=  — public tracking by order ID or phone number
    [HttpGet("track")]
    public async Task<IActionResult> Track([FromQuery] string? q)
    {
        var search = (q ?? "").Trim().ToLowerInvariant();
        var orders = await LoadOrdersAsync();
        var order = orders.Find(o => o.Id.ToLowerInvariant() == search || (o.Phone ?? "").ToLowerInvariant() == search)
            ?? throw new HttpError(404, "Order not found");
        return Ok(order);
    }

    // GET /api/orders/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var order = await db.Orders.AsNoTracking()
            .Include(item => item.Items)
            .FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new HttpError(404, "Order not found");
        return Ok(EntityMapping.ToOrder(order));
    }

    // POST /api/orders  — place a new order. Every new order starts as "Pending".
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] PlaceOrderRequest body)
    {
        if (body.Items is null || body.Items.Count == 0) throw new HttpError(400, "Cart is empty");
        if (string.IsNullOrEmpty(body.Phone)) throw new HttpError(400, "Phone is required");
        if (body.ServiceType == "Delivery" && string.IsNullOrEmpty(body.Address)) throw new HttpError(400, "Address is required");

        // Order ID like FH-8496943-12
        var millis = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        var order = new OrderEntity
        {
            Id = $"FH-{millis[^7..]}-{Random.Shared.Next(10, 100)}",
            UserId = User.GetUserId() ?? "",
            Status = "Pending",
            PlacedAt = Now(),
            Total = body.Total,
            ServiceType = body.ServiceType,
            Address = body.Address ?? "",
            Phone = body.Phone,
        };
        order.Items = EntityMapping.ReadItems(order.Id, body.Items);
        EntityMapping.ApplyBranch(order, body.Branch);
        EntityMapping.ApplyDestination(order, body.Destination);

        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return StatusCode(201, EntityMapping.ToOrder(order));
    }

    // PUT /api/orders/{id}/status  — admin changes the status; a customer may only cancel their own order while it's still Pending
    [HttpPut("{id}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Status)) throw new HttpError(400, "Status is required");

        var order = await db.Orders.Include(item => item.Items).FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new HttpError(404, "Order not found");

        if (!User.IsAdmin())
        {
            var customerCancelling = order.UserId == User.GetUserId() && body.Status == "Cancelled";
            if (!customerCancelling) throw new HttpError(403, "Admin only");
            if (order.Status != "Pending") throw new HttpError(400, "You can only cancel an order while it is Pending.");
        }

        order.Status = body.Status;
        if (body.Status == "Cancelled")
        {
            order.CancelledAt = Now();
            order.CancelReason = body.CancelReason ?? body.Reason ?? "";
        }

        await db.SaveChangesAsync();
        return Ok(EntityMapping.ToOrder(order));
    }

    // DELETE /api/orders/{id}  — admin only
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        if (!User.IsAdmin()) throw new HttpError(403, "Admin only");

        var order = await db.Orders.FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new HttpError(404, "Order not found");

        db.Orders.Remove(order);
        await db.SaveChangesAsync();
        return Ok(new { message = "Order deleted" });
    }

    // Oldest placedAt first, matching orders.json. Phone tracking returns that oldest match.
    private async Task<List<Order>> LoadOrdersAsync()
    {
        var orders = await db.Orders.AsNoTracking()
            .Include(order => order.Items)
            .OrderBy(order => order.PlacedAt)
            .ThenBy(order => order.Id)
            .ToListAsync();
        return orders.Select(EntityMapping.ToOrder).ToList();
    }

    // Same date format as Node's toISOString(), e.g. 2026-05-15T15:21:36.943Z
    private static string Now() => DateTime.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);
}
