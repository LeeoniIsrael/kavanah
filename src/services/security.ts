import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "kavanah.auth.tokens";
const DEVICE_KEY_KEY = "kavanah.device.cache-key";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresAt: string;
  provider: "apple" | "google";
};

export function isAuthTokens(value: unknown): value is AuthTokens {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.accessToken === "string" &&
    typeof candidate.refreshToken === "string" &&
    typeof candidate.expiresAt === "string" &&
    (candidate.provider === "apple" || candidate.provider === "google") &&
    (candidate.idToken === undefined || typeof candidate.idToken === "string")
  );
}

export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  });
}

export async function loadAuthTokens(): Promise<AuthTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isAuthTokens(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearAuthTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getDeviceCacheKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_KEY_KEY);
  if (existing) {
    return existing;
  }
  const key = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${Date.now()}-${Math.random()}`);
  await SecureStore.setItemAsync(DEVICE_KEY_KEY, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  });
  return key;
}

export function maskLocationForExternalServices(latitude: number, longitude: number): { latitude: number; longitude: number } {
  return {
    latitude: Number(latitude.toFixed(1)),
    longitude: Number(longitude.toFixed(1))
  };
}

export function redactPii(input: string): string {
  return input
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[redacted-phone]")
    .replace(/\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr)\b/gi, "[redacted-address]");
}
