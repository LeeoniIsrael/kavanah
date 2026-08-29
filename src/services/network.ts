const HTTPS_ONLY = /^https:\/\//i;

export type RetryOptions = {
  retries: number;
  timeoutMs: number;
  baseDelayMs?: number;
};

class NonRetryableRequestError extends Error {}

export async function secureFetch(input: string, init: RequestInit = {}, options: RetryOptions = { retries: 2, timeoutMs: 8000 }): Promise<Response> {
  if (!HTTPS_ONLY.test(input)) {
    throw new Error("Kavanah blocks non-HTTPS network traffic.");
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...init.headers
        }
      });
      if (response.ok) {
        return response;
      }
      const responseError = new Error(`Request failed with status ${response.status}`);
      if (!isRetryableStatus(response.status)) {
        throw new NonRetryableRequestError(responseError.message);
      }
      lastError = responseError;
    } catch (error) {
      if (error instanceof NonRetryableRequestError) {
        throw error;
      }
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
    if (attempt < options.retries) {
      await delay((options.baseDelayMs ?? 250) * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Network request failed.");
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
