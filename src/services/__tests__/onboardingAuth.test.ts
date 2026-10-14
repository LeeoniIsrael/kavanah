import * as AppleAuthentication from "expo-apple-authentication";
import type { Session } from "@supabase/supabase-js";
import { requireCircle, updateAccountMetadata } from "@/services/network/client";
import { signInWithApple, recordTermsAcceptance } from "../onboardingAuth";

jest.mock("react-native", () => ({ Platform: { OS: "ios" } }));
jest.mock("expo-apple-authentication", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { EMAIL: 0, FULL_NAME: 1 },
}));
jest.mock("expo-crypto", () => ({
  getRandomBytes: () => new Uint8Array(32),
  digestStringAsync: jest.fn().mockResolvedValue("hashed-nonce"),
  CryptoDigestAlgorithm: { SHA256: "SHA256" },
}));
jest.mock("expo-linking", () => ({}));
jest.mock("expo-web-browser", () => ({}));
jest.mock("@/services/network/client", () => ({ requireCircle: jest.fn(), updateAccountMetadata: jest.fn() }));


describe("Apple sign-in", () => {
  beforeEach(() => jest.clearAllMocks());
  it("returns quietly after cancellation without authenticating or accepting terms", async () => {
    jest.mocked(AppleAuthentication.signInAsync).mockRejectedValue({
      code: "ERR_REQUEST_CANCELED",
      message: "RequestCanceledException: The user canceled the authorization attempt (at AppleAuthenticationExceptions.swift:63)",
    });
    await expect(signInWithApple()).resolves.toBe(false);
    expect(requireCircle).not.toHaveBeenCalled();
  });
  it("propagates real failures to the friendly UI error boundary", async () => {
    const error = { code: "ERR_REQUEST_FAILED", message: "native detail" };
    jest.mocked(AppleAuthentication.signInAsync).mockRejectedValue(error);
    await expect(signInWithApple()).rejects.toBe(error);
  });
});


test("terms acceptance writes only to the originating authentication session", async () => {
  const origin = { access_token: "alice-token", user: { id: "alice", is_anonymous: false } } as Session;
  await recordTermsAcceptance(origin);
  expect(updateAccountMetadata).toHaveBeenCalledWith(origin, expect.objectContaining({ terms_version: "2026-08-10" }));
  expect(requireCircle).not.toHaveBeenCalled();
});
test("missing authentication result cannot record consent for a later session", async () => {
  jest.mocked(updateAccountMetadata).mockClear();
  await expect(recordTermsAcceptance(null)).rejects.toThrow("Sign in again");
  expect(updateAccountMetadata).not.toHaveBeenCalled();
});


test("successful Apple sign-in records consent against its returned session and only requests email", async () => {
  jest.clearAllMocks();
  const session = { access_token: "origin-token", user: { id: "alice", is_anonymous: false } } as Session;
  const signInWithIdToken = jest.fn().mockResolvedValue({ data: { session }, error: null });
  jest.mocked(requireCircle).mockReturnValue({ auth: { signInWithIdToken } } as unknown as ReturnType<typeof requireCircle>);
  jest.mocked(AppleAuthentication.signInAsync).mockResolvedValue({ identityToken: "test-identity-token" } as AppleAuthentication.AppleAuthenticationCredential);
  await expect(signInWithApple()).resolves.toBe(true);
  expect(AppleAuthentication.signInAsync).toHaveBeenCalledWith(expect.objectContaining({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL], nonce: "hashed-nonce" }));
  expect(updateAccountMetadata).toHaveBeenCalledWith(session, expect.objectContaining({ terms_version: "2026-08-10" }));
});
