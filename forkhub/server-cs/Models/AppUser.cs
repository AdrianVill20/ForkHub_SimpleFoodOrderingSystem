using System.Text.Json;
using System.Text.Json.Serialization;

namespace ForkHub.Api.Models;

public sealed class AppUser
{
    [JsonPropertyName("id"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public string? Id { get; set; }
    [JsonPropertyName("email"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public string? Email { get; set; }
    [JsonPropertyName("password"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public string? Password { get; set; }
    [JsonPropertyName("firstName"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public string? FirstName { get; set; }
    [JsonPropertyName("lastName"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public string? LastName { get; set; }
    [JsonPropertyName("phone"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public string? Phone { get; set; }
    [JsonPropertyName("address"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public string? Address { get; set; }
    [JsonPropertyName("role"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public string? Role { get; set; }
    [JsonPropertyName("createdAt"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public string? CreatedAt { get; set; }
    [JsonPropertyName("isDeleted"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public bool? IsDeleted { get; set; }
    [JsonPropertyName("deletedAt"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public string? DeletedAt { get; set; }
    [JsonPropertyName("scheduledDeletionAt"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public string? ScheduledDeletionAt { get; set; }
    [JsonExtensionData] public Dictionary<string, JsonElement>? Extra { get; set; }

    public object ToResponse()
    {
        var response = new Dictionary<string, object?>
        {
            ["id"] = Id, ["email"] = Email, ["firstName"] = FirstName ?? "", ["lastName"] = LastName ?? "",
            ["phone"] = Phone ?? "", ["address"] = Address ?? "", ["role"] = Role ?? "customer"
        };
        if (CreatedAt is not null) response["createdAt"] = CreatedAt;
        response["isDeleted"] = IsDeleted ?? false;
        response["scheduledDeletionAt"] = ScheduledDeletionAt;
        return response;
    }
}
