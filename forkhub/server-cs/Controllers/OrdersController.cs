using ForkHub.Api.Auth;
using ForkHub.Api.Constants;
using ForkHub.Api.Models;
using ForkHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForkHub.Api.Controllers;

// Same routes as server/routes/order.routes.js. Only handles requests and responses;
// the rules are in OrderService and the database work in OrderRepository.
[ApiController]
[Route("api/orders")]
public class OrdersController(OrderService orderService) : ControllerBase
{
    // GET /api/orders  — admin gets all, customer gets their own
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll() =>
        Ok(await orderService.GetOrdersAsync(User.GetUserId(), User.IsAdmin()));

    // GET /api/orders/track?q=  — public tracking by order ID or phone number
    [HttpGet("track")]
    public async Task<IActionResult> Track([FromQuery] string? q) =>
        Ok(await orderService.TrackAsync(q));

    // GET /api/orders/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id) =>
        Ok(await orderService.GetOrderAsync(id));

    // POST /api/orders  — place a new order (customers only; starts as Pending)
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] PlaceOrderRequest body) =>
        StatusCode(201, await orderService.PlaceOrderAsync(body, User.GetUserId(), User.IsAdmin()));

    // PUT /api/orders/{id}/status  — admin changes the status; a customer may only cancel their own Pending order
    [HttpPut("{id}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusRequest body) =>
        Ok(await orderService.UpdateStatusAsync(id, body, User.GetUserId(), User.IsAdmin()));

    // DELETE /api/orders/{id}  — admin only
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(string id)
    {
        await orderService.DeleteAsync(id);
        return Ok(new { message = Messages.Orders.Deleted });
    }
}
