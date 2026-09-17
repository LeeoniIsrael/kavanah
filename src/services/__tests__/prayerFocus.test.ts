/* eslint-disable import/first */

const openURL = jest.fn(async () => undefined);
const openSettings = jest.fn(async () => undefined);
const sendIntent = jest.fn(async () => undefined);
const mockPlatform = { OS: "ios" };

jest.mock("react-native", () => ({
  Linking: { openSettings, openURL, sendIntent },
  Platform: mockPlatform
}));

import { getPrayerFocusSetup, openPrayerFocusSetup } from "@/services/prayerFocus";

describe("prayer focus setup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatform.OS = "ios";
  });

  it("opens Shortcuts for an iPhone automation", async () => {
    expect(getPrayerFocusSetup().actionLabel).toBe("Open Shortcuts");
    await expect(openPrayerFocusSetup()).resolves.toBe(true);
    expect(openURL).toHaveBeenCalledWith("shortcuts://");
  });

  it("opens Android Do Not Disturb settings", async () => {
    mockPlatform.OS = "android";
    expect(getPrayerFocusSetup().actionLabel).toBe("Open Do Not Disturb");
    await expect(openPrayerFocusSetup()).resolves.toBe(true);
    expect(sendIntent).toHaveBeenCalledWith("android.settings.ZEN_MODE_SETTINGS");
  });

  it("falls back to app settings when a system destination is unavailable", async () => {
    openURL.mockRejectedValueOnce(new Error("Unavailable"));
    await expect(openPrayerFocusSetup()).resolves.toBe(true);
    expect(openSettings).toHaveBeenCalledTimes(1);
  });
});
