// Preserve each test's fetch double without loading native Expo networking.
export const fetch: typeof globalThis.fetch = (input, init) =>
  globalThis.fetch(input, init);
