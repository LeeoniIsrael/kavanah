import "react-native-url-polyfill/auto";
import { createClient, processLock } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { fetch as expoFetch } from "expo/fetch";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const circleConfigured = Boolean(url && key);
// Native credentials live in Keychain/Keystore. Web sessions are deliberately memory-only.
const memory = new Map<string, string>();
const storage = {
  getItem: (k: string) =>
    Platform.OS === "web"
      ? Promise.resolve(memory.get(k) ?? null)
      : SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) =>
    Platform.OS === "web"
      ? Promise.resolve(void memory.set(k, v))
      : SecureStore.setItemAsync(k, v, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }),
  removeItem: (k: string) =>
    Platform.OS === "web"
      ? Promise.resolve(void memory.delete(k))
      : SecureStore.deleteItemAsync(k),
};
const boundedFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, 12000);
  init?.signal?.addEventListener("abort", abort, { once: true });
  if (init?.signal?.aborted) abort();
  try {
    const response = await expoFetch(input, {
      ...init,
      signal: controller.signal,
    });
    // PostgREST is capped at 200 rows. Buffer under the deadline; do not return
    // headers and silently leave an unbounded body read outside the timeout.
    if (Number(response.headers.get("content-length")) > 2 * 1024 * 1024)
      throw new Error("Circle response is too large.");
    if (!response.body || [204, 205].includes(response.status)) return response;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 2 * 1024 * 1024)
          throw new Error("Circle response is too large.");
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
      headers: response.headers,
    });
  } finally {
    clearTimeout(timer);
    controller.abort();
    init?.signal?.removeEventListener("abort", abort);
  }
};
export const circleClient = circleConfigured
  ? createClient(url!, key!, {
      global: { fetch: boundedFetch },
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;
export function requireCircle() {
  if (!circleClient)
    throw new Error(
      "Circle accounts are not available in this build yet. Your practice stays on this device.",
    );
  return circleClient;
}
export async function circleRpc(
  name: string,
  args: Record<string, unknown> = {},
  expectedUser?: string,
) {
  const client = requireCircle();
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();
  if (
    sessionError ||
    !session ||
    (expectedUser && session.user.id !== expectedUser)
  )
    throw new Error("Sign in to this account to sync its changes.");
  // Pin the request to the session checked above, even if sign-out occurs before fetch.
  const { data, error } = await client
    .rpc(name, args)
    .setHeader("Authorization", `Bearer ${session.access_token}`);
  if (error?.code === "23505" && name === "circle_join")
    throw new Error("That handle is already taken. Choose another.");
  if (error?.code === "P0002" && name === "circle_record")
    throw new Error(
      "This prayer is not available for Circle yet. It is still saved on your device.",
    );
  if (error) throw new Error(error.message);
  return data;
}
