import * as AppleAuthentication from "expo-apple-authentication";
import * as LocalAuthentication from "expo-local-authentication";
import { create } from "zustand";

import { clearAuthTokens, loadAuthTokens, saveAuthTokens, type AuthTokens } from "@/services/security";

const BIOMETRIC_PREFERENCE_KEY = "kavanah.biometric-lock-enabled";

type AuthState = {
  tokens: AuthTokens | null;
  biometricLockEnabled: boolean;
  hydrate: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  setBiometricLockEnabled: (enabled: boolean) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  tokens: null,
  biometricLockEnabled: false,
  hydrate: async () => {
    const [tokens, biometricPreference] = await Promise.all([
      loadAuthTokens(),
      SecurePreference.get(BIOMETRIC_PREFERENCE_KEY)
    ]);
    set({ tokens, biometricLockEnabled: biometricPreference === "true" });
  },
  signInWithApple: async () => {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL, AppleAuthentication.AppleAuthenticationScope.FULL_NAME]
    });
    if (!credential.identityToken) {
      throw new Error("Apple did not return an identity token.");
    }
    const tokens: AuthTokens = {
      accessToken: credential.authorizationCode ?? credential.identityToken,
      refreshToken: credential.user,
      idToken: credential.identityToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      provider: "apple"
    };
    await saveAuthTokens(tokens);
    set({ tokens });
  },
  signOut: async () => {
    await clearAuthTokens();
    set({ tokens: null });
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
