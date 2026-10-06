/* eslint-disable import/first */
import type { Session } from "@supabase/supabase-js";
const mockRpc = jest.fn();
const mockSignOut = jest.fn();
const mockOwner = jest.fn();
const mockClear = jest.fn();
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
  usePrayerIdentityStore: { getState: jest.fn() },
}));
import { deleteCircleAccount, useCircleAccount } from "../circleAccountStore";
import { File, Paths } from "expo-file-system";
import { userStorage } from "@/services/mmkv";
import { writeSocialData } from "@/services/socialStorage";
const session = (id: string) => ({ user: { id } }) as Session;
beforeEach(() => {
  mockRpc.mockReset().mockResolvedValue(null);
  mockSignOut.mockReset().mockResolvedValue({ error: null });
  mockOwner.mockClear();
  mockClear.mockClear();
  userStorage.clearAll();
  useCircleAccount.setState({
    session: session("alice"),
    profile: null,
    ready: true,
  });
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
