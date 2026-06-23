import * as AppleAuthentication from "expo-apple-authentication";
import * as LocalAuthentication from "expo-local-authentication";
import { create } from "zustand";

import { clearAuthTokens, loadAuthTokens, saveAuthTokens, type AuthTokens } from "@/services/security";

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
    set({ tokens: await loadAuthTokens() });
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
      set({ biometricLockEnabled: false });
      return true;
    }
    const available = await get().unlockWithBiometrics();
    if (available) {
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
