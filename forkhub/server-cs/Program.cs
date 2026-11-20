using ForkHub.Api;
using ForkHub.Api.Auth;
using ForkHub.Api.Data;
using ForkHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Project root (the folder with data/ and public/), one level above server-cs
var rootDir = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, builder.Configuration["RootDir"] ?? ".."));

builder.Services.AddSingleton(new JsonStore(Path.Combine(rootDir, "data")));

// SQLite file lives next to the project. The folder must exist before EF opens the file.
// Controllers still read and write JSON. The database is filled from those files at startup.
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

// dotnet ef loads this program while it builds a migration. Skip the import there,
// because the new tables do not exist until the migration is applied.
var runningUnderEfTools = AppDomain.CurrentDomain.GetAssemblies().Any(assembly =>
    assembly.GetName().Name == "Microsoft.EntityFrameworkCore.Design");
if (!runningUnderEfTools)
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<ForkHubDbContext>();
    await db.Database.MigrateAsync();
    var imported = await new JsonDataImporter(db, scope.ServiceProvider.GetRequiredService<JsonStore>())
        .ImportAsync();
    app.Logger.LogInformation(
        "SQLite import added {Users} users ({UsersSkipped} already stored), {MenuItems} menu items ({MenuItemsSkipped} already stored), {Orders} orders ({OrdersSkipped} already stored), {OrderItems} order items ({OrderItemsSkipped} already stored)",
        imported.Users.Added,
        imported.Users.Skipped,
        imported.MenuItems.Added,
        imported.MenuItems.Skipped,
        imported.Orders.OrdersAdded,
        imported.Orders.OrdersSkipped,
        imported.Orders.ItemsAdded,
        imported.Orders.ItemsSkipped);
}

app.MapControllers();

app.MapFallback(context =>
{
    context.Response.StatusCode = 404;
    return context.Response.WriteAsJsonAsync(new { message = $"Route not found: {context.Request.Method} {context.Request.Path}" });
});

app.Run();
