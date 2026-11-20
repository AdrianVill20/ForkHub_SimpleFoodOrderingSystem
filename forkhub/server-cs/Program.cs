using ForkHub.Api;
using ForkHub.Api.Auth;
using ForkHub.Api.Data;
using ForkHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Project root (the folder with data/ and public/), one level above server-cs
var rootDir = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, builder.Configuration["RootDir"] ?? ".."));

builder.Services.AddSingleton(new JsonStore(Path.Combine(rootDir, "data")));

// SQLite file lives next to the project. The folder must exist before EF opens the file.
// Tables are not created in this step. Controllers still read and write JSON.
var appDataDir = Path.Combine(builder.Environment.ContentRootPath, "App_Data");
Directory.CreateDirectory(appDataDir);
var connectionString = builder.Configuration.GetConnectionString("ForkHub")
    ?? throw new InvalidOperationException("Connection string 'ForkHub' is missing.");
builder.Services.AddDbContext<ForkHubDbContext>(options => options.UseSqlite(connectionString));

builder.Services.AddForkHubAuth(builder.Configuration);
builder.Services.AddHostedService<AccountDeletionCleanupService>();

builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins("http://localhost:5173")
    .WithMethods("GET", "POST", "PUT", "DELETE")
    .AllowAnyHeader()
    .AllowCredentials()));

builder.Services.AddControllers()
    // Bad request bodies return { message } like the Node backend, not ASP.NET's default error shape
    .ConfigureApiBehaviorOptions(options => options.InvalidModelStateResponseFactory = context =>
        new BadRequestObjectResult(new { message = "Invalid request body" }));

var app = builder.Build();

// Every error becomes { message }, same as server/app.js
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (HttpError error)
    {
        context.Response.StatusCode = error.Status;
        await context.Response.WriteAsJsonAsync(new { message = error.Message });
    }
    catch (Exception error)
    {
        app.Logger.LogError(error, "Unhandled error");
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new { message = "Internal server error" });
    }
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

var imagesDir = Path.Combine(rootDir, "public", "images");
Directory.CreateDirectory(imagesDir);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(imagesDir),
    RequestPath = "/images",
});

app.MapControllers();

app.MapFallback(context =>
{
    context.Response.StatusCode = 404;
    return context.Response.WriteAsJsonAsync(new { message = $"Route not found: {context.Request.Method} {context.Request.Path}" });
});

app.Run();
