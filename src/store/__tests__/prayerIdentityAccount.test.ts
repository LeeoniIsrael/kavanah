/* eslint-disable import/first */
import type { Session } from "@supabase/supabase-js";
const mockGetSession = jest.fn();
const mockUpdate = jest.fn();
const mockWrite = jest.fn();
const mockRead = jest.fn();
jest.mock("@/services/network/client", () => ({
  circleClient: { auth: { getSession: () => mockGetSession() } },
  updateAccountMetadata: (...args: unknown[]) => mockUpdate(...args),
}));
jest.mock("@/services/socialStorage", () => ({ readSocialData: (...args: unknown[]) => mockRead(...args) ?? null, writeSocialData: (...args: unknown[]) => mockWrite(...args) }));
import { usePrayerIdentityStore } from "../prayerIdentityStore";

const identity = { audience: "woman", community: "unsure" } as const;
const session = (id: string, anonymous = false) => ({ user: { id, is_anonymous: anonymous }, access_token: `${id}-token` }) as Session;
const result = (value: Session | null) => ({ data: { session: value }, error: null });
beforeEach(() => {
  mockGetSession.mockReset();
  mockUpdate.mockReset().mockResolvedValue(undefined);
  mockWrite.mockClear();
  mockRead.mockReset();
  usePrayerIdentityStore.setState({ identity: null, completed: false, ownerId: null });
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
  expect(mockWrite).toHaveBeenCalledWith("prayer.identity.account.v1", { ownerId: "alice", identity, completed: false });
  expect(usePrayerIdentityStore.getState()).toMatchObject({ identity, completed: false });
});

test("account restoration replaces a previous person's identity and selected prayer book", () => {
  usePrayerIdentityStore.setState({ identity: { audience: "man", community: "hasidic" }, completed: true });
  usePrayerIdentityStore.getState().restoreFromAccount({ prayer_identity: identity }, "bob");
  expect(usePrayerIdentityStore.getState()).toMatchObject({ identity, completed: true });
  expect(mockWrite).toHaveBeenCalledWith("siddur.book", null);
  expect(mockUpdate).not.toHaveBeenCalled();
});

test.each([{}, { prayer_identity: { audience: "invalid" } }])("missing or invalid account metadata cannot inherit completed onboarding", metadata => {
  usePrayerIdentityStore.setState({ identity, completed: true });
  usePrayerIdentityStore.getState().restoreFromAccount(metadata, "bob");
  expect(usePrayerIdentityStore.getState()).toMatchObject({ identity: null, completed: false });
  expect(mockWrite).toHaveBeenCalledWith("prayer.identity.v1", null);
  expect(mockWrite).toHaveBeenCalledWith("onboarding.complete.v1", false);
  expect(mockUpdate).not.toHaveBeenCalled();
});

test("same-owner restart retains a saved identity when the auth token's metadata is stale", async () => {
  mockGetSession.mockResolvedValue(result(session("alice")));
  await usePrayerIdentityStore.getState().save(identity, "alice");
  usePrayerIdentityStore.getState().finish();
  mockWrite.mockClear();
  usePrayerIdentityStore.getState().restoreFromAccount({}, "alice");
  expect(usePrayerIdentityStore.getState()).toMatchObject({ identity, completed: true, ownerId: "alice" });
  expect(mockWrite).not.toHaveBeenCalled();
  usePrayerIdentityStore.getState().restoreFromAccount({}, "bob");
  expect(usePrayerIdentityStore.getState()).toMatchObject({ identity: null, completed: false, ownerId: "bob" });
  expect(mockWrite).toHaveBeenLastCalledWith("prayer.identity.account.v1", { ownerId: "bob", identity: null, completed: false });
});

test.each([identity, null])("restart reads owner and identity from one record even if legacy mirrors changed before a crash", savedIdentity => {
  const record = { ownerId: "alice", identity: savedIdentity, completed: savedIdentity !== null };
  mockRead.mockImplementation((key: string) => {
    if (key === "prayer.identity.account.v1") return record;
    if (key === "prayer.identity.v1") return { audience: "man", community: "hasidic" };
    if (key === "onboarding.complete.v1") return true;
    return null;
  });
  jest.isolateModules(() => {
    const { usePrayerIdentityStore: reloaded } = jest.requireActual<{ usePrayerIdentityStore: typeof usePrayerIdentityStore }>("../prayerIdentityStore");
    expect(reloaded.getState()).toMatchObject(record);
  });
});
