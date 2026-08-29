import { secureFetch } from "@/services/network";

describe("secureFetch", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as typeof fetch;
  });

  it("blocks non-HTTPS traffic", async () => {
    await expect(secureFetch("http://example.com")).rejects.toThrow("blocks non-HTTPS");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not retry a client error that cannot recover", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(secureFetch("https://example.com", {}, { retries: 2, timeoutMs: 100, baseDelayMs: 0 })).rejects.toThrow("status 404");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a temporary server error", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const response = await secureFetch("https://example.com", {}, { retries: 1, timeoutMs: 100, baseDelayMs: 0 });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
