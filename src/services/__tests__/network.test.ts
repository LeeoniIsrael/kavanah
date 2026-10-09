import { secureFetch } from "@/services/network";

describe("secureFetch", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as typeof fetch;
  });

  it("blocks non-HTTPS traffic", async () => {
    await expect(secureFetch("http://example.com")).rejects.toThrow(
      "blocks non-HTTPS",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not retry a client error that cannot recover", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(
      secureFetch(
        "https://example.com",
        {},
        { retries: 2, timeoutMs: 100, baseDelayMs: 0 },
      ),
    ).rejects.toThrow("status 404");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a temporary server error", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const response = await secureFetch(
      "https://example.com",
      {},
      { retries: 1, timeoutMs: 100, baseDelayMs: 0 },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

it("rejects unbounded retry settings before starting work", async () => {
  const fetchMock = jest.fn();
  global.fetch = fetchMock;
  await expect(
    secureFetch(
      "https://example.com",
      {},
      { retries: Infinity, timeoutMs: 100 },
    ),
  ).rejects.toThrow("Invalid network");
  expect(fetchMock).not.toHaveBeenCalled();
});
it("never automatically replays a side-effecting request", async () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 503 });
  global.fetch = fetchMock;
  await expect(
    secureFetch(
      "https://example.com",
      { method: "POST" },
      { retries: 3, timeoutMs: 100 },
    ),
  ).rejects.toThrow("status 503");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("terminates retries at the configured maximum", async () => {
  const fetchMock = jest.fn().mockRejectedValue(new Error("Offline"));
  global.fetch = fetchMock;
  await expect(
    secureFetch(
      "https://example.com",
      {},
      { retries: 2, timeoutMs: 100, baseDelayMs: 0 },
    ),
  ).rejects.toThrow("Offline");
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
it("rejects oversized streaming responses without retrying", async () => {
  const response = new Response(new Uint8Array(2 * 1024 * 1024 + 1));
  const fetchMock = jest.fn().mockResolvedValue(response);
  global.fetch = fetchMock;
  await expect(secureFetch("https://example.com")).rejects.toThrow("too large");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("times out a stalled body as well as the initial connection", async () => {
  const fetchMock = jest.fn().mockImplementation(
    async (_url, init) =>
      new Response(
        new ReadableStream({
          start(controller) {
            init.signal.addEventListener("abort", () =>
              controller.error(new Error("Aborted")),
            );
          },
        }),
      ),
  );
  global.fetch = fetchMock;
  await expect(
    secureFetch("https://example.com", {}, { retries: 0, timeoutMs: 10 }),
  ).rejects.toThrow("Aborted");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("honors caller cancellation and avoids retries", async () => {
  const controller = new AbortController();
  controller.abort();
  const fetchMock = jest.fn();
  global.fetch = fetchMock;
  await expect(
    secureFetch("https://example.com", { signal: controller.signal }),
  ).rejects.toThrow("cancelled");
  expect(fetchMock).not.toHaveBeenCalled();
});
