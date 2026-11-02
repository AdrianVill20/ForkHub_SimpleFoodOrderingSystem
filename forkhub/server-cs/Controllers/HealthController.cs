using Microsoft.AspNetCore.Mvc;

namespace ForkHub.Api.Controllers;

// Example controller for the team: copy this pattern for Auth, Menu and Orders.
[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok" });
}
