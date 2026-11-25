using ForkHub.Api;
using ForkHub.Api.Auth;
using ForkHub.Api.Data;
using ForkHub.Api.Repositories;
using ForkHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Project root (the folder with data/ and public/), one level above server-cs
var rootDir = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, builder.Configuration["RootDir"] ?? ".."));

// SQLite file lives next to the project. The folder must exist before EF opens the file.
// Controllers read and write this database.
var appDataDir = Path.Combine(builder.Environment.ContentRootPath, "App_Data");
Directory.CreateDirectory(appDataDir);
var configuredConnection = builder.Configuration.GetConnectionString("ForkHub")
    ?? throw new InvalidOperationException("Connection string 'ForkHub' is missing.");
// SQLite treats a relative Data Source as relative to the shell's folder.
// Pin it to server-cs so the file is always App_Data/forkhub.db beside this project.
var sqliteConnection = new SqliteConnectionStringBuilder(configuredConnection);
if (!Path.IsPathRooted(sqliteConnection.DataSource))
    sqliteConnection.DataSource = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, sqliteConnection.DataSource));
builder.Services.AddDbContext<ForkHubDbContext>(options => options.UseSqlite(sqliteConnection.ToString()));

// Menu and Orders: Controller -> Service (rules) -> Repository (database / files)
builder.Services.AddScoped<MenuRepository>();
builder.Services.AddScoped<MenuImageRepository>();
builder.Services.AddScoped<MenuService>();
builder.Services.AddScoped<OrderRepository>();
builder.Services.AddScoped<OrderService>();

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

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ForkHubDbContext>();
    await db.Database.MigrateAsync();
}

app.MapControllers();

app.MapFallback(context =>
{
    context.Response.StatusCode = 404;
    return context.Response.WriteAsJsonAsync(new { message = $"Route not found: {context.Request.Method} {context.Request.Path}" });
});

app.Run();
