namespace ForkHub.Api.Data;

// One row in the Users table. Field names match data/users.json.
// The id stays a string (a GUID like "09f1ec02-..."), not a database-generated number.
public class UserEntity
{
    public string Id { get; set; } = "";
    public string Email { get; set; } = "";

    // BCrypt hash. API responses must never include this value.
    public string Password { get; set; } = "";

    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Phone { get; set; } = "";

    // One address string, matching the JSON file. The ERD splits this into street and city.
    public string Address { get; set; } = "";

    public string Role { get; set; } = "customer";

    // Kept as text so values like "2026-05-02T02:20:18.378Z" round-trip unchanged.
    // Missing on the oldest JSON user, so this stays optional.
    public string? CreatedAt { get; set; }

    public bool? IsDeleted { get; set; }
    public string? DeletedAt { get; set; }
    public string? ScheduledDeletionAt { get; set; }
}
