/* eslint-disable import/first */
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

const mockGetSession = jest.fn();
const mockLookup = jest.fn();
const mockOwner = jest.fn();
const mockRpc = jest.fn();
const mockUnsubscribe = jest.fn();
const mockUpdateMetadata = jest.fn();
const mockRestoreIdentity = jest.fn();
const mockCancelReminders = jest.fn<Promise<void>, []>(async () => undefined);
jest.mock("@/services/reminderScheduler", () => ({ cancelLocalRemindersForDeletion: () => mockCancelReminders(), syncReminders: jest.fn() }));
let mockAuthEvent: (event: AuthChangeEvent, session: Session | null) => void;
jest.mock("@/services/network/client", () => {
  const client = {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (callback: typeof mockAuthEvent) => {
        mockAuthEvent = callback;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      },
      updateUser: jest.fn(async () => ({ error: null })),
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => mockLookup() }) }) }),
  };
  return { circleClient: client, requireCircle: () => client, circleRpc: () => mockRpc(), updateAccountMetadata: (...args: unknown[]) => mockUpdateMetadata(...args) };
});
jest.mock("@/services/network/outbox", () => ({
  setOutboxOwner: (id: string | null) => mockOwner(id),
  flushCircle: jest.fn(), clearOutbox: jest.fn(), pendingCirclePreferences: () => null,
}));
jest.mock("@/services/socialStorage", () => ({ readSocialData: () => null, writeSocialData: jest.fn(), removeAccountLocalData: jest.fn() }));
jest.mock("@/store/prayerIdentityStore", () => ({ usePrayerIdentityStore: { getState: () => ({ identity: { audience: "woman", community: "hasidic" }, restoreFromAccount: (...args: unknown[]) => mockRestoreIdentity(...args) }) } }));
jest.mock("@/store/socialStore", () => ({ useSocialStore: { setState: jest.fn() } }));
import { loadCircleAccount, restoreCircleSession, startCircleAccount, useCircleAccount } from "../circleAccountStore";
import { setAccountScope } from "@/services/accountScope";

const session = (id = "alice", anonymous = false) => ({ user: { id, is_anonymous: anonymous } }) as Session;
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
let stop: (() => void) | undefined;
beforeEach(() => {
  setAccountScope(null);
  mockCancelReminders.mockReset().mockResolvedValue(undefined);
  jest.useFakeTimers();
  mockGetSession.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  mockLookup.mockReset().mockResolvedValue({ data: null, error: null });
  mockRpc.mockReset().mockResolvedValue({ prayers: "off", milestones: false });
  mockOwner.mockClear();
  mockUpdateMetadata.mockClear();
  mockRestoreIdentity.mockReset();
  useCircleAccount.setState({ session: null, profile: null, sessionReady: false, sessionError: null, ready: false, error: null });
});

test("sign-in never copies legacy device prayer identity into the new cloud account", async () => {
  await loadCircleAccount(session("bob"));
  expect(mockRestoreIdentity).toHaveBeenCalledWith({}, "bob");
  expect(mockUpdateMetadata).not.toHaveBeenCalled();
});

test("same-account profile reload preserves preferences saved since the cached auth token", async () => {
  await loadCircleAccount(session("alice"));
  mockRestoreIdentity.mockClear();
  await loadCircleAccount(session("alice"));
  expect(mockRestoreIdentity).not.toHaveBeenCalled();
});

test("failed native reminder cleanup blocks access and is retried even though the account scope changed", async () => {
  mockCancelReminders.mockRejectedValueOnce(new Error("Native failure"));
  await loadCircleAccount(session("alice"));
  expect(useCircleAccount.getState()).toMatchObject({ session: null, sessionReady: true, sessionError: expect.stringContaining("safely switch") });
  expect(mockLookup).not.toHaveBeenCalled();
  await loadCircleAccount(session("alice"));
  expect(useCircleAccount.getState().session?.user.id).toBe("alice");
  expect(mockCancelReminders).toHaveBeenCalledTimes(2);
});

test("a slow old-account transition cannot grant access after a newer account arrives", async () => {
  let release!: () => void;
  mockCancelReminders.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
  const alice = loadCircleAccount(session("alice"));
  await loadCircleAccount(session("bob"));
  release(); await alice;
  expect(useCircleAccount.getState().session?.user.id).toBe("bob");
  expect(mockRestoreIdentity).not.toHaveBeenCalledWith({}, "alice");
});

test("auth events restore the new identity before publishing the new session", async () => {
  stop = startCircleAccount(); await flush();
  mockRestoreIdentity.mockImplementation(() => {
    expect(useCircleAccount.getState().session).toBeNull();
  });
  mockAuthEvent("SIGNED_IN", session("bob"));
  expect(useCircleAccount.getState().session).toBeNull();
  jest.runOnlyPendingTimers(); await flush();
  expect(mockRestoreIdentity).toHaveBeenCalledWith({}, "bob");
  expect(useCircleAccount.getState().session?.user.id).toBe("bob");
});
afterEach(() => { stop?.(); stop = undefined; jest.useRealTimers(); });

test("restoration rejects anonymous sessions before profile lookup or syncing", async () => {
  mockGetSession.mockResolvedValue({ data: { session: session("guest", true) }, error: null });
  await restoreCircleSession();
  expect(useCircleAccount.getState()).toMatchObject({ session: null, sessionReady: true, ready: true });
  expect(mockLookup).not.toHaveBeenCalled();
  expect(mockOwner).not.toHaveBeenCalledWith("guest");
});

test("restoration failures block access and can be retried without granting a session", async () => {
  mockGetSession.mockResolvedValue({ data: { session: null }, error: new Error("secret token") });
  await restoreCircleSession();
  expect(useCircleAccount.getState()).toMatchObject({ session: null, sessionReady: true, sessionError: expect.stringContaining("Could not restore") });
  expect(useCircleAccount.getState().sessionError).not.toContain("secret");
  mockGetSession.mockResolvedValue({ data: { session: session() }, error: null });
  await restoreCircleSession();
  expect(useCircleAccount.getState()).toMatchObject({ session: session(), sessionReady: true, sessionError: null });
});

test("a signed-in account retains local access when Circle profile loading is offline", async () => {
  mockLookup.mockResolvedValue({ data: null, error: new Error("Offline") });
  await loadCircleAccount(session());
  expect(useCircleAccount.getState()).toMatchObject({ session: session(), sessionReady: true, ready: true, error: "Could not load your account." });
});

test("sign-out revokes access immediately and cancels queued sign-in hydration", async () => {
  stop = startCircleAccount();
  await flush();
  mockAuthEvent("SIGNED_IN", session());
  expect(useCircleAccount.getState().session).toBeNull();
  mockAuthEvent("SIGNED_OUT", null);
  expect(useCircleAccount.getState().session).toBeNull();
  expect(mockOwner).toHaveBeenLastCalledWith(null);
  jest.runOnlyPendingTimers(); await flush();
  expect(useCircleAccount.getState().session).toBeNull();
  expect(mockLookup).not.toHaveBeenCalled();
});

test("late restoration failure cannot replace a newer successful sign-in", async () => {
  let reject!: (error: Error) => void;
  mockGetSession.mockImplementation(() => new Promise((_, fail) => { reject = fail; }));
  stop = startCircleAccount();
  mockAuthEvent("SIGNED_IN", session());
  reject(new Error("Offline")); await flush();
  expect(useCircleAccount.getState()).toMatchObject({ session: null, sessionError: null });
  jest.runOnlyPendingTimers(); await flush();
  expect(useCircleAccount.getState().session?.user.id).toBe("alice");
});

test("token refresh during profile loading does not cancel the profile result", async () => {
  let resolve!: (value: unknown) => void;
  mockGetSession.mockResolvedValue({ data: { session: session() }, error: null });
  mockLookup.mockImplementation(() => new Promise(finish => { resolve = finish; }));
  stop = startCircleAccount(); await flush();
  mockAuthEvent("TOKEN_REFRESHED", session());
  resolve({ data: { id: "alice", handle: "alice", display_name: "Alice" }, error: null });
  await flush();
  expect(useCircleAccount.getState()).toMatchObject({ ready: true, profile: { id: "alice" } });
});


test("an obsolete successful switch cannot clear a newer cleanup failure", async () => {
  let release!: () => void;
  mockCancelReminders.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
  const alice = loadCircleAccount(session("alice"));
  mockCancelReminders.mockRejectedValueOnce(new Error("Native failure"));
  await loadCircleAccount(session("bob"));
  release(); await alice;
  expect(useCircleAccount.getState().session).toBeNull();
  await loadCircleAccount(session("bob"));
  expect(mockCancelReminders).toHaveBeenCalledTimes(3);
  expect(useCircleAccount.getState().session?.user.id).toBe("bob");
});

test("preference storage failure blocks access with a recoverable sanitized error", async () => {
  mockRestoreIdentity.mockImplementationOnce(() => { throw new Error("private storage details"); });
  await loadCircleAccount(session("alice"));
  expect(useCircleAccount.getState()).toMatchObject({ session: null, sessionReady: true, sessionError: expect.stringContaining("safely load") });
  expect(mockLookup).not.toHaveBeenCalled();
  await loadCircleAccount(session("alice"));
  expect(useCircleAccount.getState().session?.user.id).toBe("alice");
});


test("duplicate sign-in events cannot bypass a still-pending local transition", async () => {
  const releases: (() => void)[] = [];
  mockCancelReminders.mockImplementation(() => new Promise<void>(resolve => { releases.push(resolve); }));
  const first = loadCircleAccount(session("alice"));
  const second = loadCircleAccount(session("alice"));
  expect(mockCancelReminders).toHaveBeenCalledTimes(2);
  expect(useCircleAccount.getState().session).toBeNull();
  expect(mockLookup).not.toHaveBeenCalled();
  releases[0]!(); await first;
  expect(useCircleAccount.getState().session).toBeNull();
  releases[1]!(); await second;
  expect(useCircleAccount.getState().session?.user.id).toBe("alice");
});
