import * as LocalAuthentication from "expo-local-authentication";
import { create } from "zustand";

const BIOMETRIC_PREFERENCE_KEY = "kavanah.biometric-lock-enabled";

type AuthState = {
  biometricLockEnabled: boolean;
  hydrate: () => Promise<void>;
  setBiometricLockEnabled: (enabled: boolean) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  biometricLockEnabled: false,
  hydrate: async () => {
    const biometricPreference = await SecurePreference.get(BIOMETRIC_PREFERENCE_KEY);
    set({ biometricLockEnabled: biometricPreference === "true" });
  },
  setBiometricLockEnabled: async (enabled) => {
    if (!enabled) {
      await SecurePreference.set(BIOMETRIC_PREFERENCE_KEY, "false");
      set({ biometricLockEnabled: false });
      return true;
    }
    const available = await get().unlockWithBiometrics();
    if (available) {
      await SecurePreference.set(BIOMETRIC_PREFERENCE_KEY, "true");
      set({ biometricLockEnabled: true });
    }
    return available;
  },
  unlockWithBiometrics: async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) {
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Kavanah",
      cancelLabel: "Cancel",
      disableDeviceFallback: false
    });
    return result.success;
  }
}));

const SecurePreference = {
  async get(key: string): Promise<string | null> {
    const SecureStore = await import("expo-secure-store");
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    });
  }
};
