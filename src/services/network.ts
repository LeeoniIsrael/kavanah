import { fetch as expoFetch } from "expo/fetch";

const HTTPS_ONLY = /^https:\/\//i;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
export type RetryOptions = {
  retries: number;
  timeoutMs: number;
  baseDelayMs?: number;
};
class NonRetryableRequestError extends Error {}

// Public text requests are buffered under the same deadline as their headers.
// Side-effecting requests are never replayed automatically.
export async function secureFetch(
  input: string,
  init: RequestInit = {},
  options: RetryOptions = { retries: 2, timeoutMs: 8000 },
): Promise<Response> {
  if (!HTTPS_ONLY.test(input))
    throw new Error("Kavanah blocks non-HTTPS network traffic.");
  if (
    !Number.isInteger(options.retries) ||
    options.retries < 0 ||
    options.retries > 3 ||
    !Number.isFinite(options.timeoutMs) ||
    options.timeoutMs < 1 ||
    options.timeoutMs > 30000 ||
    (options.baseDelayMs !== undefined &&
      (!Number.isFinite(options.baseDelayMs) ||
        options.baseDelayMs < 0 ||
        options.baseDelayMs > 2000))
  ) {
    throw new Error("Invalid network retry or timeout limits.");
  }
  const retries = ["GET", "HEAD"].includes((init.method ?? "GET").toUpperCase())
    ? options.retries
    : 0;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (init.signal?.aborted) throw new Error("Request cancelled.");
    const controller = new AbortController();
    const cancel = () => controller.abort();
    init.signal?.addEventListener("abort", cancel, { once: true });
    const timeout = setTimeout(cancel, options.timeoutMs);
    try {
      const headers = new Headers(init.headers);
      if (!headers.has("Accept")) headers.set("Accept", "application/json");
      // Expo's native fetch exposes a streaming body; React Native's legacy XHR
      // fetch buffers it before JavaScript can enforce the response-size limit.
      const response = await expoFetch(input, {
        ...init,
        signal: controller.signal,
        headers,
      });
      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        const message = `Request failed with status ${response.status}`;
        if (![408, 429].includes(response.status) && response.status < 500)
          throw new NonRetryableRequestError(message);
        throw new Error(message);
      }
      if (!response.body) return response;
      if (Number(response.headers.get("content-length")) > MAX_RESPONSE_BYTES)
        throw new NonRetryableRequestError("Response is too large.");
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > MAX_RESPONSE_BYTES)
            throw new NonRetryableRequestError("Response is too large.");
          chunks.push(value);
        }
      } finally {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }
      const data = new Uint8Array(bytes);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return new Response(data, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (error) {
      if (error instanceof NonRetryableRequestError || init.signal?.aborted)
        throw error;
      lastError = error;
    } finally {
      controller.abort();
      clearTimeout(timeout);
      init.signal?.removeEventListener("abort", cancel);
    }
    if (attempt < retries) {
      const ms = Math.min(2000, (options.baseDelayMs ?? 250) * 2 ** attempt);
      await new Promise<void>((resolve) => setTimeout(resolve, ms));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Network request failed.");
}
