const HTTPS_ONLY = /^https:\/\//i;

export type RetryOptions = {
  retries: number;
  timeoutMs: number;
};

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
      clearTimeout(timeout);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`Request failed with status ${response.status}`);
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
    }
    await delay(250 * (attempt + 1));
  }

  throw lastError instanceof Error ? lastError : new Error("Network request failed.");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
