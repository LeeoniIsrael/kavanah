/* eslint-disable import/first */
import type { Session } from "@supabase/supabase-js";
const mockGetSession = jest.fn();
const mockUpdate = jest.fn();
const mockWrite = jest.fn();
jest.mock("@/services/network/client", () => ({
  circleClient: { auth: { getSession: () => mockGetSession() } },
  updateAccountMetadata: (...args: unknown[]) => mockUpdate(...args),
}));
jest.mock("@/services/socialStorage", () => ({ readSocialData: () => null, writeSocialData: (...args: unknown[]) => mockWrite(...args) }));
import { usePrayerIdentityStore } from "../prayerIdentityStore";

const identity = { audience: "woman", community: "unsure" } as const;
const session = (id: string, anonymous = false) => ({ user: { id, is_anonymous: anonymous }, access_token: `${id}-token` }) as Session;
const result = (value: Session | null) => ({ data: { session: value }, error: null });
beforeEach(() => {
  mockGetSession.mockReset();
  mockUpdate.mockReset().mockResolvedValue(undefined);
  mockWrite.mockClear();
  usePrayerIdentityStore.setState({ identity: null, completed: false });
});

test.each([null, session("guest", true), session("bob")])("preference saving refuses missing, anonymous, or changed accounts", async current => {
  mockGetSession.mockResolvedValue(result(current));
  await expect(usePrayerIdentityStore.getState().save(identity, "alice")).rejects.toThrow("Sign in");
  expect(mockUpdate).not.toHaveBeenCalled();
  expect(mockWrite).not.toHaveBeenCalled();
});

test("an account change during a save cannot persist the previous account's local preference", async () => {
  const alice = session("alice");
  mockGetSession.mockResolvedValueOnce(result(alice)).mockResolvedValueOnce(result(session("bob")));
  await expect(usePrayerIdentityStore.getState().save(identity, "alice")).rejects.toThrow("sign-in changed");
  expect(mockUpdate).toHaveBeenCalledWith(alice, { prayer_identity: identity });
  expect(mockWrite).not.toHaveBeenCalled();
  expect(usePrayerIdentityStore.getState().identity).toBeNull();
});

test("a failed server save preserves local preferences and onboarding state", async () => {
  mockGetSession.mockResolvedValue(result(session("alice")));
  mockUpdate.mockRejectedValue(new Error("Offline"));
  await expect(usePrayerIdentityStore.getState().save(identity, "alice")).rejects.toThrow("Offline");
  expect(mockWrite).not.toHaveBeenCalled();
  expect(usePrayerIdentityStore.getState()).toMatchObject({ identity: null, completed: false });
});

test("a successful save for the same account persists its preferences", async () => {
  mockGetSession.mockResolvedValue(result(session("alice")));
  await usePrayerIdentityStore.getState().save(identity, "alice");
  expect(mockWrite).toHaveBeenCalledWith("prayer.identity.v1", identity);
  expect(mockWrite).toHaveBeenCalledWith("siddur.book", null);
  expect(usePrayerIdentityStore.getState()).toMatchObject({ identity, completed: false });
});
