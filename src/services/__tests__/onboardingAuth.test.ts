import * as AppleAuthentication from "expo-apple-authentication";
import { requireCircle } from "@/services/network/client";
import { signInWithApple } from "../onboardingAuth";

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
jest.mock("@/services/network/client", () => ({ requireCircle: jest.fn() }));


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
