import { useZmanimStore, invalidateLocationRequests } from "../zmanimStore";
import { requestZmanimLocation } from "@/services/location";
import type { GeoPoint } from "@/types/zmanim";
jest.mock("@/services/location", () => ({ requestZmanimLocation: jest.fn() }));
test("an in-flight location lookup cannot restore coordinates after local deletion", async () => {
  let finish!: (point: GeoPoint) => void;
  jest.mocked(requestZmanimLocation).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  useZmanimStore.setState({ isLoading: false, location: null });
  const refresh = useZmanimStore.getState().refresh();
  invalidateLocationRequests();
  useZmanimStore.setState({ isLoading: false, location: null });
  finish({ latitude: 40, longitude: -74, label: "Private location" });
  await refresh;
  expect(useZmanimStore.getState().location).toBeNull();
  expect(useZmanimStore.getState().isLoading).toBe(false);
});
