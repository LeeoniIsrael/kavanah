/* eslint-disable import/first */
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

const mockGetSession = jest.fn();
const mockLookup = jest.fn();
const mockOwner = jest.fn();
const mockRpc = jest.fn();
const mockUnsubscribe = jest.fn();
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
  return { circleClient: client, requireCircle: () => client, circleRpc: () => mockRpc() };
});
jest.mock("@/services/network/outbox", () => ({
  setOutboxOwner: (id: string | null) => mockOwner(id),
  flushCircle: jest.fn(), clearOutbox: jest.fn(), pendingCirclePreferences: () => null,
}));
jest.mock("@/services/socialStorage", () => ({ readSocialData: () => null, writeSocialData: jest.fn(), removeAccountLocalData: jest.fn() }));
jest.mock("@/store/prayerIdentityStore", () => ({ usePrayerIdentityStore: { getState: () => ({ identity: null, restoreFromAccount: jest.fn() }) } }));
jest.mock("@/store/socialStore", () => ({ useSocialStore: { setState: jest.fn() } }));
import { loadCircleAccount, restoreCircleSession, startCircleAccount, useCircleAccount } from "../circleAccountStore";

const session = (id = "alice", anonymous = false) => ({ user: { id, is_anonymous: anonymous } }) as Session;
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
let stop: (() => void) | undefined;
beforeEach(() => {
  jest.useFakeTimers();
  mockGetSession.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  mockLookup.mockReset().mockResolvedValue({ data: null, error: null });
  mockRpc.mockReset().mockResolvedValue({ prayers: "off", milestones: false });
  mockOwner.mockClear();
  useCircleAccount.setState({ session: null, profile: null, sessionReady: false, sessionError: null, ready: false, error: null });
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
  expect(useCircleAccount.getState()).toMatchObject({ session: session(), sessionReady: true, ready: true, error: "Offline" });
});

test("sign-out revokes access immediately and cancels queued sign-in hydration", async () => {
  stop = startCircleAccount();
  await flush();
  mockAuthEvent("SIGNED_IN", session());
  expect(useCircleAccount.getState().session?.user.id).toBe("alice");
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
  expect(useCircleAccount.getState()).toMatchObject({ session: session(), sessionError: null });
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
