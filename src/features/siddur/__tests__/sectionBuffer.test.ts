import { createSectionBuffer } from "../sectionBuffer";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("warms the next 30 percent from the current position and reuses it", async () => {
  const read = jest.fn(async () => []);
  const buffer = createSectionBuffer(read);
  buffer.preload("book", Array.from({ length: 100 }, (_, i) => String(i)), 40);
  expect(read).not.toHaveBeenCalled();
  await jest.runAllTimersAsync();
  expect(read.mock.calls).toHaveLength(30);
  expect(read).toHaveBeenNthCalledWith(1, "book", "41");
  expect(read).toHaveBeenLastCalledWith("book", "70");
  await buffer.load("book", "55");
  expect(read).toHaveBeenCalledTimes(30);
});

test("shares pending requests, isolates books and retries failures", async () => {
  const read = jest.fn().mockRejectedValueOnce(new Error("failed")).mockResolvedValue([]);
  const buffer = createSectionBuffer(read);
  const first = buffer.load("a", "ref");
  expect(buffer.load("a", "ref")).toBe(first);
  await expect(first).rejects.toThrow("failed");
  await buffer.load("a", "ref");
  await buffer.load("b", "ref");
  expect(read).toHaveBeenCalledTimes(3);
});

test("cancels old work on navigation and clamps at the end of the book", async () => {
  const read = jest.fn(async () => []);
  const buffer = createSectionBuffer(read);
  const refs = Array.from({ length: 10 }, (_, i) => String(i));
  const cancel = buffer.preload("book", refs, 0);
  await jest.advanceTimersByTimeAsync(16);
  cancel();
  buffer.preload("book", refs, 8);
  await jest.runAllTimersAsync();
  expect(read.mock.calls).toEqual([["book", "1"], ["book", "9"]]);
});

test("retains recently read sections while bounding memory", async () => {
  const read = jest.fn(async () => []);
  const buffer = createSectionBuffer(read, 2);
  await buffer.load("book", "a");
  await buffer.load("book", "b");
  await buffer.load("book", "a");
  await buffer.load("book", "c");
  await buffer.load("book", "a");
  expect(read).toHaveBeenCalledTimes(3);
  await buffer.load("book", "b");
  expect(read).toHaveBeenCalledTimes(4);
});

test("failed speculative work does not stop later sections", async () => {
  const read = jest.fn().mockRejectedValueOnce(new Error("failed")).mockResolvedValue([]);
  const buffer = createSectionBuffer(read);
  buffer.preload("book", ["0", "1", "2", "3", "4"], 0);
  await jest.runAllTimersAsync();
  expect(read).toHaveBeenCalledTimes(2);
  await buffer.load("book", "1");
  expect(read).toHaveBeenCalledTimes(3);
});
