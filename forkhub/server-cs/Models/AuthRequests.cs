namespace ForkHub.Api.Models;

public sealed record RegisterRequest(string? Email, string? Password, string? FirstName, string? LastName, string? Phone, string? Address, string? AdminCode);
public sealed record LoginRequest(string? Email, string? Password);
public sealed record UpdateProfileRequest(string? FirstName, string? LastName, string? Phone, string? Address);
