using ForkHub.Api.Constants;
using ForkHub.Api.Models;
using ForkHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForkHub.Api.Controllers;

// Same routes as server/routes/menu.routes.js. Only handles requests and responses;
// the rules are in MenuService and the database work in MenuRepository.
[ApiController]
[Route("api/menu")]
public class MenuController(MenuService menuService) : ControllerBase
{
    // POST /api/menu/upload  (form fields: category, image)
    [HttpPost("upload")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Upload()
    {
        var form = Request.HasFormContentType ? await Request.ReadFormAsync() : null;
        var path = await menuService.UploadImageAsync(form?.Files["image"], form?["category"].ToString());
        return Ok(new { path });
    }

    // GET /api/menu?category=Pizza
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category) =>
        Ok(await menuService.GetMenuAsync(category));

    // GET /api/menu/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id) =>
        Ok(await menuService.GetItemAsync(id));

    // POST /api/menu  — add new item
    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Create([FromBody] MenuItemRequest body) =>
        StatusCode(201, await menuService.CreateAsync(body));

    // PUT /api/menu/{id}  — edit existing item, only the fields that were sent
    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(string id, [FromBody] MenuItemRequest body) =>
        Ok(await menuService.UpdateAsync(id, body));

    // DELETE /api/menu/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(string id)
    {
        var name = await menuService.DeleteAsync(id);
        return Ok(new { message = Messages.Menu.Deleted(name) });
    }
}
