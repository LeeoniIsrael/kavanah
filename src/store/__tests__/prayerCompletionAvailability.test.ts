jest.mock("react-native", () => ({ Platform: { OS: "web" } }));
jest.mock("@/services/location", () => ({ requestZmanimLocation: jest.fn() }));
import { usePrayerStore } from "../prayerStore";
import { useZmanimStore } from "../zmanimStore";
import { ComplexZmanimCalendar, GeoLocation } from "kosher-zmanim";

it("does not save a reader completion after sunset, including an earlier start", () => {
  const now = new Date(2026, 8, 24, 12);
  const calendar = new ComplexZmanimCalendar(
    new GeoLocation(
      "New York",
      40.7128,
      -74.006,
      0,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ),
  );
  calendar.setDate(now);
  const sunset = calendar.getSeaLevelSunset()!.toJSDate();
  useZmanimStore.setState({
    location: { label: "New York", latitude: 40.7128, longitude: -74.006 },
    locationCheckedAt: +sunset - 60000,
  });
  usePrayerStore.setState({ history: [] });
  const prayer = { id: "modeh-ani", title: "Modeh Ani" };
  expect(
    usePrayerStore
      .getState()
      .recordCompletion(prayer, sunset, new Date(+sunset - 300000), "reader", "tefillin"),
  ).toBeNull();
  expect(usePrayerStore.getState().history).toEqual([]);
  expect(
    usePrayerStore.getState().recordCompletion(prayer, new Date(+sunset - 1), undefined, "reader", "tefillin"),
  ).not.toBeNull();
  expect(usePrayerStore.getState().history).toHaveLength(1);
});
it("rejects stale location without preventing untimed prayer history", () => {
  useZmanimStore.setState({ locationCheckedAt: 0 });
  expect(
    usePrayerStore
      .getState()
      .recordCompletion({ id: "tefillin-blessing", title: "Tefillin" }),
  ).toBeNull();
  expect(
    usePrayerStore
      .getState()
      .recordCompletion({ id: "modeh-ani", title: "Modeh Ani" }),
  ).not.toBeNull();
});

it("uses the reader's matched practice when enforcing the completion window", () => {
  const now = new Date(2026, 8, 24, 12);
  const calendar = new ComplexZmanimCalendar(
    new GeoLocation(
      "New York",
      40.7128,
      -74.006,
      0,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ),
  );
  calendar.setDate(now);
  const sunset = calendar.getSeaLevelSunset()!.toJSDate();
  useZmanimStore.setState({
    location: { label: "New York", latitude: 40.7128, longitude: -74.006 },
    locationCheckedAt: +sunset - 60000,
  });
  usePrayerStore.setState({ history: [] });

  expect(
    usePrayerStore.getState().recordCompletion(
      { id: "remote-mincha-section", title: "Ashrei" },
      sunset,
      new Date(+sunset - 300000),
      "reader",
      "mincha",
    ),
  ).toBeNull();
  expect(usePrayerStore.getState().history).toEqual([]);
});

it("rejects removed prayers without deleting historical entries", async () => {
  const store = usePrayerStore.getState();
  const history = store.history;
  expect(store.recordCompletion({id: "outside-research", title: "Old text"})).toBeNull();
  await store.selectPrayer("outside-research");
  expect(usePrayerStore.getState().prayerLoadError).toContain("not included");
  expect(usePrayerStore.getState().selectedPrayerId).toBe("");
  expect(usePrayerStore.getState().history).toEqual(history);
});
