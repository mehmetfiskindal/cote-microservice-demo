export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code = "SERVICE_ERROR",
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
  }
}
