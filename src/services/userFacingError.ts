/** Only locally authored, actionable copy may cross the error/UI boundary. */
export class UserFacingError extends Error {}

function field(error: unknown, key: string): unknown {
  return error !== null && typeof error === "object"
    ? (error as Record<string, unknown>)[key]
    : undefined;
}

export function isAppleSignInCanceled(error: unknown): boolean {
  return field(error, "code") === "ERR_REQUEST_CANCELED" ||
    field(error, "name") === "RequestCanceledException" ||
    (typeof field(error, "message") === "string" &&
      /ERR_REQUEST_CANCELED|RequestCanceledException/.test(field(error, "message") as string));
}

const messages: Record<string, string> = {
  otp_expired: "That code has expired. Request a new code and try again.",
  invalid_credentials: "Those sign-in details didn’t work. Check them and try again.",
  over_email_send_rate_limit: "Too many codes were requested. Wait a few minutes before trying again.",
  over_sms_send_rate_limit: "Too many codes were requested. Wait a few minutes before trying again.",
  over_request_rate_limit: "Please wait a few minutes before trying again.",
  email_address_invalid: "Enter a valid email address.",
  email_not_confirmed: "Verify your email address before signing in.",
  session_expired: "Your session has expired. Sign in again to continue.",
  refresh_token_not_found: "Your session has expired. Sign in again to continue.",
  user_banned: "This account is unavailable. Contact support for help.",
  ERR_NETWORK: "Couldn’t connect. Check your internet connection and try again.",
  ERR_LOCATION_SERVICES_DISABLED: "Location is off. Enable it in Settings and try again.",
};

export function userFacingError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof UserFacingError) return error.message;
  const code = field(error, "code");
  if (typeof code === "string" && Object.prototype.hasOwnProperty.call(messages, code)) return messages[code] ?? fallback;
  const status = field(error, "status");
  if (status === 429) return "Please wait a few minutes before trying again.";
  const message = field(error, "message");
  if (typeof message === "string" && /network request failed|failed to fetch|networkerror|fetch failed/i.test(message)) {
    return "Couldn’t connect. Check your internet connection and try again.";
  }
  // Do not expose native exceptions, server payloads, file paths or unknown strings.
  return fallback;
}
