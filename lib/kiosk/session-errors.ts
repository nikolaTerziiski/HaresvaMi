import "server-only";

export class KioskSessionError extends Error {
  constructor(
    public readonly code:
      | "invalid_token"
      | "invalid_expiry"
      | "restaurant_not_found"
      | "create_failed"
      | "verify_failed"
      | "revoke_failed",
    message: string,
  ) {
    super(message);
    this.name = "KioskSessionError";
  }
}
