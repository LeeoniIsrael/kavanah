import { createRef } from "react";
import { fireEvent, render } from "@testing-library/react-native";
import {
  Animated,
  ScrollView as NativeScrollView,
  Text,
  View,
} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { FadeViewport, ScrollView } from "../ui/fade-scroll-view";
import { NavigationFade } from "@/navigation/NavigationFade";

let mockReducedMotion = false;
let mockFocused = true;
jest.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => mockReducedMotion,
}));
jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => (() => void) | undefined) =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest hoists this factory before imports.
    require("react").useEffect(
      () => (mockFocused ? callback() : undefined),
      [callback, mockFocused],
    ),
}));

beforeEach(() => {
  mockReducedMotion = false;
  mockFocused = true;
});
afterEach(() => jest.restoreAllMocks());

test("scroll ref, callbacks, content and horizontal paging survive the fade boundary", () => {
  const ref = createRef<NativeScrollView>();
  const onScroll = jest.fn();
  const view = render(
    <ScrollView ref={ref} horizontal pagingEnabled onScroll={onScroll}>
      <Text>Readable content</Text>
    </ScrollView>,
  );
  const scroll = view.UNSAFE_getByType(NativeScrollView);
  fireEvent.scroll(scroll, { nativeEvent: { contentOffset: { x: 30, y: 0 } } });
  expect(onScroll).toHaveBeenCalledTimes(1);
  expect(typeof ref.current?.scrollTo).toBe("function");
  expect(scroll.props.pagingEnabled).toBe(true);
  expect(view.getByText("Readable content")).toBeTruthy();
});

test("fade remains narrow in either axis and Reduced Motion immediately makes it opaque", () => {
  const view = render(
    <FadeViewport>
      <Text>Content</Text>
    </FadeViewport>,
  );
  const mask = () => view.UNSAFE_getByType(MaskedView);
  fireEvent(mask(), "layout", {
    nativeEvent: { layout: { width: 360, height: 600 } },
  });
  expect(mask().props.maskElement.type).toBe(LinearGradient);
  expect(mask().props.maskElement.props.locations).toEqual([0, 0.03, 0.97, 1]);
  view.rerender(
    <FadeViewport horizontal>
      <Text>Content</Text>
    </FadeViewport>,
  );
  fireEvent(mask(), "layout", {
    nativeEvent: { layout: { width: 360, height: 600 } },
  });
  expect(mask().props.maskElement.props.end).toEqual({ x: 1, y: 0 });
  mockReducedMotion = true;
  view.rerender(
    <FadeViewport horizontal>
      <Text>Content</Text>
    </FadeViewport>,
  );
  expect(mask().props.maskElement.type).toBe(View);
  expect(view.getByText("Content")).toBeTruthy();
});

test("returning to a mounted tab replays the reveal and stops the previous animation", () => {
  const start = jest.fn();
  const stop = jest.fn();
  const timing = jest
    .spyOn(Animated, "timing")
    .mockReturnValue({ start, stop, reset: jest.fn() });
  const view = render(
    <NavigationFade>
      <Text>Page</Text>
    </NavigationFade>,
  );
  expect(start).toHaveBeenCalledTimes(1);
  mockFocused = false;
  view.rerender(
    <NavigationFade>
      <Text>Page</Text>
    </NavigationFade>,
  );
  expect(stop).toHaveBeenCalledTimes(1);
  mockFocused = true;
  view.rerender(
    <NavigationFade>
      <Text>Page</Text>
    </NavigationFade>,
  );
  expect(start).toHaveBeenCalledTimes(2);
  expect(timing.mock.calls[1]?.[1]).toMatchObject({
    duration: 180,
    useNativeDriver: true,
  });
});

test("Reduced Motion keeps navigation readable without starting a reveal", () => {
  mockReducedMotion = true;
  const timing = jest.spyOn(Animated, "timing");
  const view = render(
    <NavigationFade>
      <Text>Page</Text>
    </NavigationFade>,
  );
  expect(timing).not.toHaveBeenCalled();
  expect(view.getByText("Page")).toBeTruthy();
});
