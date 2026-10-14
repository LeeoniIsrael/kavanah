import { isAppleSignInCanceled, UserFacingError, userFacingError } from "../userFacingError";

describe("user-facing errors", () => {
  it.each([
    new Error("RequestCanceledException: canceled (at AppleAuthenticationExceptions.swift:63)"),
    { message: "database password=secret", code: "P0001" },
    "native stack at /private/app.swift:63",
    null,
    { code: "toString" },
  ])("keeps unknown details out of the UI: %p", (error) => {
    expect(userFacingError(error, "Could not sign in. Please try again.")).toBe("Could not sign in. Please try again.");
  });
  it("retains explicitly authored validation copy", () => {
    expect(userFacingError(new UserFacingError("Enter your email address."))).toBe("Enter your email address.");
  });
  it("maps known codes without returning provider text", () => {
    expect(userFacingError({ code: "otp_expired", message: "raw backend detail" })).toBe("That code has expired. Request a new code and try again.");
    expect(userFacingError({ status: 429 })).toContain("wait a few minutes");
    expect(userFacingError(new TypeError("Network request failed"))).toContain("Check your internet connection");
  });
  it.each([
    { code: "ERR_REQUEST_CANCELED", message: "The user canceled the authorization attempt" },
    { name: "RequestCanceledException" },
    new Error("RequestCanceledException: The user canceled the authorization attempt (at ExpoAppleAuthentication/AppleAuthenticationExceptions.swift:63)"),
    new Error("ERR_REQUEST_CANCELED"),
  ])("recognizes Apple cancellation: %p", (error) => {
    expect(isAppleSignInCanceled(error)).toBe(true);
  });
  it("does not swallow real sign-in failures", () => {
    expect(isAppleSignInCanceled({ code: "ERR_REQUEST_FAILED" })).toBe(false);
    expect(isAppleSignInCanceled(new Error("Server failed"))).toBe(false);
  });
});
