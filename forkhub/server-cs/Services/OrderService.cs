using ForkHub.Api.Common;
using ForkHub.Api.Constants;
using ForkHub.Api.Data;
using ForkHub.Api.Models;
using ForkHub.Api.Repositories;

namespace ForkHub.Api.Services;

// Business rules for orders: who sees which orders, what a valid order is, who may change its status
public class OrderService(OrderRepository orders)
{
    // Admins see every order; customers see only their own
    public async Task<List<Order>> GetOrdersAsync(string? userId, bool isAdmin)
    {
        var list = await orders.GetAllAsync(isAdmin ? null : userId ?? "");
        return list.Select(EntityMapping.ToOrder).ToList();
    }

    // Public tracking by order number or phone number
    public async Task<Order> TrackAsync(string? query)
    {
        var search = (query ?? "").Trim().ToLowerInvariant();
        var order = await orders.FindByIdOrPhoneAsync(search) ?? throw new HttpError(404, Messages.Orders.NotFound);
        return EntityMapping.ToOrder(order);
    }

    public async Task<Order> GetOrderAsync(string id) =>
        EntityMapping.ToOrder(await FindOrThrowAsync(id));

    // Every new order starts as Pending. Only customers place orders.
    public async Task<Order> PlaceOrderAsync(PlaceOrderRequest request, string? userId, bool isAdmin)
    {
        if (isAdmin) throw new HttpError(403, Messages.Orders.AdminCannotOrder);
        if (request.Items is null || request.Items.Count == 0) throw new HttpError(400, Messages.Orders.CartEmpty);
        if (string.IsNullOrEmpty(request.Phone)) throw new HttpError(400, Messages.Orders.PhoneRequired);
        if (request.ServiceType == ServiceTypes.Delivery && string.IsNullOrEmpty(request.Address))
            throw new HttpError(400, Messages.Orders.AddressRequired);

        var order = new OrderEntity
        {
            Id = NewOrderId(),
            UserId = userId ?? "",
            Status = OrderStatuses.Pending,
            PlacedAt = IsoTime.Now(),
            Total = request.Total,
            ServiceType = request.ServiceType,
            Address = request.Address ?? "",
            Phone = request.Phone,
        };
        order.Items = EntityMapping.ReadItems(order.Id, request.Items);
        EntityMapping.ApplyBranch(order, request.Branch);
        EntityMapping.ApplyDestination(order, request.Destination);

        await orders.AddAsync(order);
        return EntityMapping.ToOrder(order);
    }

    // Admins may set any status. A customer may only cancel their own order, and only while it's Pending.
    public async Task<Order> UpdateStatusAsync(string id, UpdateStatusRequest request, string? userId, bool isAdmin)
    {
        if (string.IsNullOrWhiteSpace(request.Status)) throw new HttpError(400, Messages.Orders.StatusRequired);
        if (!OrderStatuses.All.Contains(request.Status)) throw new HttpError(400, Messages.Orders.InvalidStatus);

        var order = await FindOrThrowAsync(id);
        if (!isAdmin)
        {
            var cancellingOwnOrder = order.UserId == userId && request.Status == OrderStatuses.Cancelled;
            if (!cancellingOwnOrder) throw new HttpError(403, Messages.Orders.AdminOnly);
            if (order.Status != OrderStatuses.Pending) throw new HttpError(400, Messages.Orders.CancelOnlyWhilePending);
        }

        order.Status = request.Status;
        if (request.Status == OrderStatuses.Cancelled)
        {
            order.CancelledAt = IsoTime.Now();
            // The website sends the reason as "reason"; "cancelReason" is accepted too
            order.CancelReason = request.CancelReason ?? request.Reason ?? "";
        }

        await orders.SaveChangesAsync();
        return EntityMapping.ToOrder(order);
    }

    public async Task DeleteAsync(string id) =>
        await orders.RemoveAsync(await FindOrThrowAsync(id));

    private async Task<OrderEntity> FindOrThrowAsync(string id) =>
        await orders.FindAsync(id) ?? throw new HttpError(404, Messages.Orders.NotFound);

    // Order number like FH-8496943-12: last 7 digits of the time in milliseconds + a random 10-99
    private static string NewOrderId()
    {
        var millis = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        return $"FH-{millis[^7..]}-{Random.Shared.Next(10, 100)}";
    }
}
