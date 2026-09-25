import { userStorage } from "@/services/mmkv";
import { useSettingsStore } from "@/store/settingsStore";

describe("share after prayer preference", () => {
  it("defaults on and persists opt-out and re-enable", () => {
    expect(useSettingsStore.getState().shareAfterPrayer).toBe(true);
    useSettingsStore.getState().setShareAfterPrayer(false);
    expect(useSettingsStore.getState().shareAfterPrayer).toBe(false);
    expect(userStorage.getString("settings.share-after-prayer")).toBe("false");
    useSettingsStore.getState().setShareAfterPrayer(true);
    expect(useSettingsStore.getState().shareAfterPrayer).toBe(true);
    expect(userStorage.getString("settings.share-after-prayer")).toBe("true");
  });
});
