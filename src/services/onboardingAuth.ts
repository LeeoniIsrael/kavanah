import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { requireCircle } from "@/services/network/client";

export type CodeChannel = "email" | "phone";
export const TERMS_VERSION = "2026-08-10";
export async function recordTermsAcceptance(): Promise<void> {
  const { error } = await requireCircle().auth.updateUser({
    data: { terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION },
  });
  if (error) throw error;
}
export function normalizeContact(value: string, channel: CodeChannel): string {
  return channel === "email" ? value.trim().toLowerCase() : value.replace(/[\s().-]/g, "").trim();
}
export function validateContact(value: string, channel: CodeChannel): string | null {
  const normalized = normalizeContact(value, channel);
  if (channel === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? null : "Enter a valid email address.";
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? null : "Include your country code, like +1 212 555 0123.";
}
export async function sendSignInCode(value: string, channel: CodeChannel): Promise<void> {
  const message = validateContact(value, channel);
  if (message) throw new Error(message);
  const contact = normalizeContact(value, channel);
  const { error } = await requireCircle().auth.signInWithOtp(
    channel === "email"
      ? { email: contact, options: { data: { terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION } } }
      : { phone: contact, options: { data: { terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION } } },
  );
  if (error) throw error;
}
export async function verifySignInCode(value: string, code: string, channel: CodeChannel): Promise<void> {
  if (!/^\d{6,10}$/.test(code.trim())) throw new Error("Enter the code we sent you.");
  const contact = normalizeContact(value, channel);
  const { error } = await requireCircle().auth.verifyOtp(
    channel === "email"
      ? { email: contact, token: code.trim(), type: "email" }
      : { phone: contact, token: code.trim(), type: "sms" },
  );
  if (error) throw error;
}
export async function signInWithApple(): Promise<boolean> {
  if (Platform.OS !== "ios" || !(await AppleAuthentication.isAvailableAsync())) {
    throw new Error("Apple sign-in is available on supported Apple devices.");
  }
  const rawNonce = Array.from(Crypto.getRandomBytes(32), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL, AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) throw new Error("Apple did not return a sign-in token. Try again.");
    const { error } = await requireCircle().auth.signInWithIdToken({
      provider: "apple", token: credential.identityToken, nonce: rawNonce,
    });
    if (error) throw error;
    await recordTermsAcceptance();
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("ERR_REQUEST_CANCELED")) return false;
    throw error;
  }
}
export async function signInWithGoogle(): Promise<boolean> {
  const client = requireCircle();
  const redirectTo = Linking.createURL("auth");
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Google sign-in could not start. Try again.");
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return false;
  const fragment = result.url.split("#")[1] ?? result.url.split("?")[1] ?? "";
  const params = new URLSearchParams(fragment);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) throw new Error(params.get("error_description") ?? "Google sign-in did not complete. Try again.");
  const { error: sessionError } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (sessionError) throw sessionError;
  await recordTermsAcceptance();
  return true;
}
