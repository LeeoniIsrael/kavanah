/* eslint-disable import/first */
import type { Session } from "@supabase/supabase-js";
const mockRpc = jest.fn();
const mockSignOut = jest.fn();
const mockOwner = jest.fn();
const mockClear = jest.fn();
const mockLocalCleanup = jest.fn();
const mockCancelReminders = jest.fn();
jest.mock("@/services/reminderScheduler", () => ({ cancelLocalRemindersForDeletion: () => mockCancelReminders(), syncReminders: jest.fn() }));
jest.mock("@/features/siddur/cache", () => ({ clearSiddurAccountData: () => mockLocalCleanup() }));
jest.mock("@/services/network/client", () => ({
  circleClient: null,
  circleRpc: (...args: unknown[]) => mockRpc(...args),
  requireCircle: () => ({
    auth: { signOut: (...args: unknown[]) => mockSignOut(...args) },
  }),
}));
jest.mock("@/services/network/outbox", () => ({
  setOutboxOwner: (...args: unknown[]) => mockOwner(...args),
  clearOutbox: () => mockClear(),
  flushCircle: jest.fn(),
  pendingCirclePreferences: jest.fn(),
}));
jest.mock("@/store/socialStore", () => ({
  useSocialStore: { setState: jest.fn() },
}));
jest.mock("@/store/prayerIdentityStore", () => ({
  usePrayerIdentityStore: { getState: () => ({ restoreFromAccount: jest.fn() }) },
}));
import { deleteCircleAccount, loadCircleAccount, useCircleAccount } from "../circleAccountStore";
import { File, Paths } from "expo-file-system";
import { userStorage } from "@/services/mmkv";
import { writeSocialData } from "@/services/socialStorage";
const session = (id: string) => ({ user: { id } }) as Session;
beforeEach(() => {
  mockRpc.mockReset().mockResolvedValue(null);
  mockSignOut.mockReset().mockResolvedValue({ error: null });
  mockOwner.mockClear();
  mockClear.mockClear();
  mockLocalCleanup.mockReset().mockResolvedValue(undefined);
  mockCancelReminders.mockReset().mockResolvedValue(undefined);
  userStorage.clearAll();
  useCircleAccount.setState({
    session: session("alice"),
    profile: null,
    ready: true,
  });
});

test("deletion cannot sign out a newer account while its local transition is still pending", async () => {
  let finishCleanup!: () => void;
  let finishSwitch!: () => void;
  mockLocalCleanup.mockImplementation(() => new Promise<void>(resolve => { finishCleanup = resolve; }));
  const deleting = deleteCircleAccount();
  await new Promise(resolve => setImmediate(resolve));
  mockCancelReminders.mockImplementationOnce(() => new Promise<void>(resolve => { finishSwitch = resolve; }));
  const switching = loadCircleAccount(session("bob"));
  expect(useCircleAccount.getState().session).toBeNull();
  finishCleanup(); await deleting;
  expect(mockSignOut).not.toHaveBeenCalled();
  finishSwitch(); await switching;
  expect(useCircleAccount.getState().session?.user.id).toBe("bob");
});

test("a failed local cleanup after cloud deletion remains a visible access-blocking error", async () => {
  mockLocalCleanup.mockRejectedValue(new Error("private disk details"));
  await expect(deleteCircleAccount()).rejects.toThrow("local cleanup failed");
  expect(useCircleAccount.getState()).toMatchObject({ session: null, sessionReady: true, sessionError: expect.stringContaining("local cleanup failed") });
  expect(useCircleAccount.getState().sessionError).not.toContain("private disk");
  expect(mockCancelReminders).toHaveBeenCalledTimes(1);
});
test("duplicate deletion submissions share one authenticated operation and remove account files", async () => {
  let finish!: () => void;
  mockRpc.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = () => resolve(null);
      }),
  );
  const photo = new File(Paths.document, "profile-photo-alice.jpg");
  photo.write("photo");
  writeSocialData("circle.profile.alice", { id: "alice" });
  writeSocialData("circle.outbox.alice", [{ event: "private" }]);
  const first = deleteCircleAccount(),
    second = deleteCircleAccount();
  expect(second).toBe(first);
  finish();
  await first;
  expect(mockRpc).toHaveBeenCalledTimes(1);
  expect(mockRpc).toHaveBeenCalledWith("circle_delete_account", {}, "alice");
  expect(mockSignOut).toHaveBeenCalledTimes(1);
  expect(useCircleAccount.getState().session).toBeNull();
  expect(photo.exists).toBe(false);
  expect(userStorage.getString("circle.outbox.alice")).toBeUndefined();
  expect(new File(Paths.document, "circle.outbox.alice.json").exists).toBe(
    false,
  );
});
test("a deletion completing after an account switch cannot sign out or clear the new account", async () => {
  let finish!: () => void;
  mockRpc.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = () => resolve(null);
      }),
  );
  const pending = deleteCircleAccount();
  useCircleAccount.setState({ session: session("bob") });
  finish();
  await pending;
  expect(useCircleAccount.getState().session?.user.id).toBe("bob");
  expect(mockSignOut).not.toHaveBeenCalled();
  expect(mockClear).not.toHaveBeenCalled();
});
test("a failed cloud deletion preserves local records and sign-in for retry", async () => {
  mockRpc.mockRejectedValue(new Error("Offline"));
  writeSocialData("circle.profile.alice", { id: "alice" });
  await expect(deleteCircleAccount()).rejects.toThrow("Offline");
  expect(userStorage.getString("circle.profile.alice")).toBeDefined();
  expect(mockSignOut).not.toHaveBeenCalled();
});
