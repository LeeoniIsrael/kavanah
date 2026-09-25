/* eslint-disable import/first */
const openURL = jest.fn(async () => undefined);
const openSettings = jest.fn(async () => undefined);
const sendIntent = jest.fn(async () => undefined);
const shareAsync = jest.fn(async () => undefined);
const isAvailableAsync = jest.fn(async () => true);
const mockWrite = jest.fn();
const mockPlatform = { OS: "ios" };
jest.mock("react-native", () => ({
  Linking: { openSettings, openURL, sendIntent },
  Platform: mockPlatform,
}));
jest.mock("expo-sharing", () => ({ shareAsync, isAvailableAsync }));
jest.mock("expo-linking", () => ({
  createURL: (path: string) => `exp://127.0.0.1:8081/--${path}`,
}));
jest.mock("expo-file-system", () => ({
  Paths: { cache: "file:///cache" },
  File: class {
    uri = "file:///cache/Kavanah Prayer Focus.shortcut";
    exists = false;
    create() {}
    write = mockWrite;
  },
}));
import {
  getPrayerFocusSetup,
  openPrayerFocusSetup,
  prayerFocusRunUrl,
  runPrayerFocusShortcut,
} from "@/services/prayerFocus";
import { prayerFocusShortcutBase64 } from "@/data/shortcuts/prayerFocus";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("prepared Prayer Focus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatform.OS = "ios";
    isAvailableAsync.mockResolvedValue(true);
  });
  it("presents the real signed shortcut instead of opening an empty library", async () => {
    expect(getPrayerFocusSetup().actionLabel).toBe("Configure in Shortcuts");
    openURL.mockRejectedValueOnce(new Error("Document URL unavailable"));
    await expect(openPrayerFocusSetup()).resolves.toBe(true);
    expect(mockWrite).toHaveBeenCalledWith(prayerFocusShortcutBase64, {
      encoding: "base64",
    });
    expect(shareAsync).toHaveBeenCalledWith(
      expect.stringContaining("Kavanah Prayer Focus.shortcut"),
      expect.objectContaining({ UTI: "com.apple.shortcut" }),
    );
    expect(openURL).not.toHaveBeenCalledWith("shortcuts://");
  });
  it("keeps the embedded artifact identical to the Apple-signed distributable", () => {
    const file = readFileSync(
      path.join(
        process.cwd(),
        "assets/shortcuts/Kavanah Prayer Focus.shortcut",
      ),
    );
    expect(Buffer.from(prayerFocusShortcutBase64, "base64")).toEqual(file);
    expect(file.subarray(0, 4).toString()).toBe("AEA1");
  });
  it("contains only the described timed-Focus actions", () => {
    const source = JSON.parse(
      readFileSync(
        path.join(process.cwd(), "assets/shortcuts/PrayerFocus.json"),
        "utf8",
      ),
    );
    expect(
      source.WFWorkflowActions.map(
        (a: { WFWorkflowActionIdentifier: string }) =>
          a.WFWorkflowActionIdentifier,
      ),
    ).toEqual([
      "is.workflow.actions.comment",
      "is.workflow.actions.date",
      "is.workflow.actions.adjustdate",
      "is.workflow.actions.dnd.set",
    ]);
    expect(
      source.WFWorkflowActions[2].WFWorkflowActionParameters.WFDuration.Value,
    ).toEqual({ Magnitude: 15, Unit: "min" });
    expect(
      source.WFWorkflowActions[3].WFWorkflowActionParameters.AssertionType,
    ).toBe("Time");
    expect(
      source.WFWorkflowActions[3].WFWorkflowActionParameters.Time.Value
        .OutputUUID,
    ).toBe(source.WFWorkflowActions[2].WFWorkflowActionParameters.UUID);
  });
  it("reports sharing failures without sending people to unrelated settings", async () => {
    openURL.mockRejectedValueOnce(new Error("Document URL unavailable"));
    shareAsync.mockRejectedValueOnce(new Error("Unavailable"));
    await expect(openPrayerFocusSetup()).resolves.toBe(false);
    expect(openSettings).not.toHaveBeenCalled();
    isAvailableAsync.mockResolvedValueOnce(false);
    await expect(openPrayerFocusSetup()).resolves.toBe(false);
  });
  it("runs the named shortcut with success, cancel and failure callbacks", async () => {
    const url = new URL(prayerFocusRunUrl("kavanah://focus-setup"));
    expect(url.searchParams.get("name")).toBe("Kavanah Prayer Focus");
    expect(url.searchParams.get("x-success")).toBe(
      "kavanah://focus-setup?result=finished",
    );
    expect(url.searchParams.get("x-cancel")).toContain("cancelled");
    expect(url.searchParams.get("x-error")).toContain("error");
    await runPrayerFocusShortcut();
    expect(openURL).toHaveBeenCalledWith(
      expect.stringContaining(
        encodeURIComponent(
          "exp://127.0.0.1:8081/--/focus-setup?result=finished",
        ),
      ),
    );
  });
  it("opens the prepared document directly when the OS supports it", async () => {
    await expect(openPrayerFocusSetup()).resolves.toBe(true);
    expect(openURL).toHaveBeenCalledWith(
      "file:///cache/Kavanah Prayer Focus.shortcut",
    );
    expect(shareAsync).not.toHaveBeenCalled();
  });
  it("opens Android Do Not Disturb settings", async () => {
    mockPlatform.OS = "android";
    await expect(openPrayerFocusSetup()).resolves.toBe(true);
    expect(sendIntent).toHaveBeenCalledWith(
      "android.settings.ZEN_MODE_SETTINGS",
    );
  });
});
