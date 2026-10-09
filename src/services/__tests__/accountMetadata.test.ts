/* eslint-disable import/first */
import type { Session } from "@supabase/supabase-js";
jest.mock("react-native-url-polyfill/auto", () => ({}));
jest.mock("@supabase/supabase-js", () => ({ createClient: () => ({}), processLock: jest.fn() }));
const oldUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const oldKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-public-key";
import { updateAccountMetadata } from "../network/client";

const originalFetch = global.fetch;
const fetchMock = jest.fn();
const alice = { user: { id: "alice", is_anonymous: false }, access_token: "alice-token" } as Session;
beforeEach(() => { global.fetch = fetchMock; fetchMock.mockReset(); });
afterEach(() => { global.fetch = originalFetch; });
afterAll(() => {
  if (oldUrl === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL; else process.env.EXPO_PUBLIC_SUPABASE_URL = oldUrl;
  if (oldKey === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY; else process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = oldKey;
});

test("metadata updates use the originating bearer token and a bounded transport", async () => {
  fetchMock.mockResolvedValue(new Response("{}"));
  await updateAccountMetadata(alice, { prayer_identity: { community: "unsure" } });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith("https://example.supabase.co/auth/v1/user", expect.objectContaining({
    method: "PUT", headers: expect.objectContaining({ Authorization: "Bearer alice-token" }),
    body: '{"data":{"prayer_identity":{"community":"unsure"}}}', signal: expect.any(AbortSignal),
  }));
});

test("anonymous metadata updates are rejected before networking", async () => {
  await expect(updateAccountMetadata({ ...alice, user: { ...alice.user, is_anonymous: true } }, {})).rejects.toThrow("Sign in");
  expect(fetchMock).not.toHaveBeenCalled();
});

test("failed metadata updates are not replayed or exposed as raw server errors", async () => {
  fetchMock.mockResolvedValue(new Response('{"message":"sensitive error"}', { status: 502 }));
  await expect(updateAccountMetadata(alice, {})).rejects.toThrow("Could not save account preferences");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
