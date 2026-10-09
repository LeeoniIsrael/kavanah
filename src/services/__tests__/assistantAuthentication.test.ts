/* eslint-disable import/first */
import type { Session } from "@supabase/supabase-js";
const mockGetSession = jest.fn();
jest.mock("@/services/network/client", () => ({ requireCircle: () => ({ auth: { getSession: () => mockGetSession() } }) }));
import { createAssistantStream } from "../assistantService";

const fetchMock = jest.fn();
const originalFetch = global.fetch;
beforeEach(() => {
  Object.assign(globalThis, { __DEV__: false });
  global.fetch = fetchMock;
  fetchMock.mockReset();
  mockGetSession.mockReset();
});
afterEach(() => { global.fetch = originalFetch; });

test.each([null, { user: { id: "guest", is_anonymous: true } }])("assistant refuses missing or anonymous sessions before sending a request", async session => {
  mockGetSession.mockResolvedValue({ data: { session }, error: null });
  await expect(createAssistantStream("Explain", ["Prayer"]).next()).rejects.toThrow("Sign in");
  expect(fetchMock).not.toHaveBeenCalled();
});

test("assistant pins its request to the signed-in account token", async () => {
  const session = { user: { id: "alice", is_anonymous: false }, access_token: "test-session-token" } as Session;
  mockGetSession.mockResolvedValue({ data: { session }, error: null });
  fetchMock.mockResolvedValue(new Response('data: {"delta":"Answer"}\n\ndata: {"done":true}\n\n'));
  let answer = "";
  for await (const part of createAssistantStream("Explain", ["Prayer"])) answer += part;
  expect(answer).toBe("Answer");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0]?.[1].headers).toMatchObject({ Authorization: "Bearer test-session-token" });
  expect(fetchMock.mock.calls[0]?.[1].headers).not.toHaveProperty("X-Kavanah-Install-Id");
});
