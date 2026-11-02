namespace ForkHub.Api;

// Throw this anywhere to send { message } with a status code, like createHttpError in the Node backend.
// Example: throw new HttpError(404, "Menu item not found");
public class HttpError(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}
