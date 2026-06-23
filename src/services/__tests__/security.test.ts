import { maskLocationForExternalServices, redactPii } from "@/services/security";

describe("security helpers", () => {
  it("redacts common PII before assistant transport", () => {
    const redacted = redactPii("Email me at person@example.com or call +1 (212) 555-0199 near 10 Main Street.");

    expect(redacted).toContain("[redacted-email]");
    expect(redacted).toContain("[redacted-phone]");
    expect(redacted).toContain("[redacted-address]");
  });

  it("reduces coordinate precision for external services", () => {
    expect(maskLocationForExternalServices(40.712776, -74.005974)).toEqual({
      latitude: 40.7,
      longitude: -74
    });
  });
});
