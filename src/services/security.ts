import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const INSTALLATION_ID_KEY = "kavanah.installation-id";

export async function getOrCreateInstallationId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  if (existing) {
    return existing;
  }
  const installationId = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${Date.now()}-${Math.random()}-${Math.random()}`
  );
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, installationId, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  });
  return installationId;
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
