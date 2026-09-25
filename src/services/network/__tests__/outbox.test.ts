import { circleRpc } from "../client";
import {
  setOutboxOwner,
  queueCircle,
  flushCircle,
  useCircleSync,
  skipFailedCircleChange,
} from "../outbox";
const mockStorage = new Map<string, unknown>();
jest.mock("@/services/socialStorage", () => ({
  readSocialData: (key: string) => mockStorage.get(key) ?? null,
  writeSocialData: (key: string, value: unknown) =>
    mockStorage.set(key, JSON.parse(JSON.stringify(value))),
}));
jest.mock("../client", () => ({ circleRpc: jest.fn() }));
const rpc = jest.mocked(circleRpc);
const settle = () => new Promise((resolve) => setImmediate(resolve));
beforeEach(() => {
  mockStorage.clear();
  rpc.mockReset().mockResolvedValue(null);
  setOutboxOwner(null);
});
test("private device actions never upload without a signed-in owner", async () => {
  queueCircle("circle_record", { event: "local" }, "local");
  await settle();
  expect(rpc).not.toHaveBeenCalled();
});
test("failed completion survives retry with the same event id and owner", async () => {
  setOutboxOwner("alice");
  rpc.mockRejectedValueOnce(new Error("Offline"));
  queueCircle("circle_record", { event: "one" }, "one");
  await settle();
  expect(useCircleSync.getState()).toMatchObject({
    pending: 1,
    error: "Offline",
  });
  await flushCircle();
  expect(rpc).toHaveBeenLastCalledWith(
    "circle_record",
    { event: "one" },
    "alice",
  );
  expect(useCircleSync.getState()).toMatchObject({ pending: 0, error: null });
});
test("pending commands cannot move to another account", async () => {
  setOutboxOwner("alice");
  rpc.mockRejectedValueOnce(new Error("Offline"));
  queueCircle("circle_record", { event: "alice-event" }, "one");
  await settle();
  setOutboxOwner("bob");
  await flushCircle();
  expect(rpc).toHaveBeenCalledTimes(1);
  setOutboxOwner("alice");
  await flushCircle();
  expect(rpc).toHaveBeenLastCalledWith(
    "circle_record",
    { event: "alice-event" },
    "alice",
  );
});
test("sharing preference failures block later uploads and cannot be skipped", async () => {
  setOutboxOwner("alice");
  rpc.mockRejectedValue(new Error("Offline"));
  queueCircle("circle_preferences", { prayer_mode: "off" }, "preferences");
  await settle();
  queueCircle("circle_record", { event: "private" }, "private");
  await settle();
  skipFailedCircleChange();
  expect(useCircleSync.getState().pending).toBe(2);
  rpc.mockResolvedValue(null);
  await flushCircle();
  expect(rpc.mock.calls.slice(-2).map((x) => x[0])).toEqual([
    "circle_preferences",
    "circle_record",
  ]);
});
test("an old account in-flight response cannot remove the next account queue", async () => {
  setOutboxOwner("alice");
  let finish: () => void = () => {};
  rpc.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = () => resolve(null);
      }),
  );
  queueCircle("circle_record", { event: "alice" }, "alice");
  await settle();
  setOutboxOwner("bob");
  queueCircle("circle_record", { event: "bob" }, "bob");
  finish();
  await settle();
  expect(useCircleSync.getState().pending).toBe(1);
  await flushCircle();
  expect(rpc).toHaveBeenLastCalledWith(
    "circle_record",
    { event: "bob" },
    "bob",
  );
});
