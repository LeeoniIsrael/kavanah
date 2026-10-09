// Native-independent unit tests use only platform selection; UI tests use jest-expo.
export const Platform = { OS: "ios", select: (options: Record<string, unknown>) => options.ios ?? options.default };
