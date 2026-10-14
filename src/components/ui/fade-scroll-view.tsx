import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef, useState, type ReactNode } from "react";
import {
  ScrollView as NativeScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { contentMotion } from "@/design/contentMotion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** A fixed, narrow alpha ramp: scrolling itself reveals content, on the GPU.
 * No timers, per-row observers, nested scroll owners, or changes to hit targets.
 */
export function FadeViewport({
  children,
  horizontal = false,
  style,
}: {
  children: ReactNode;
  horizontal?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const length = horizontal ? size.width : size.height;
  const edge = length > 0 ? Math.min(contentMotion.edge / length, 0.15) : 0;
  return (
    <MaskedView
      style={[styles.viewport, style]}
      onLayout={({ nativeEvent: { layout } }) =>
        setSize({ width: layout.width, height: layout.height })
      }
      maskElement={
        reducedMotion || !length ? (
          <View style={styles.opaque} />
        ) : (
          <LinearGradient
            style={StyleSheet.absoluteFill}
            colors={["transparent", "black", "black", "transparent"]}
            locations={[0, edge, 1 - edge, 1]}
            start={{ x: 0, y: 0 }}
            end={horizontal ? { x: 1, y: 0 } : { x: 0, y: 1 }}
          />
        )
      }
    >
      {children}
    </MaskedView>
  );
}

// Preserve the native ref API (scrollTo, scrollToEnd) and all scroll callbacks.
export type ScrollView = NativeScrollView;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- Keep the native component's value/type API.
export const ScrollView = forwardRef<NativeScrollView, ScrollViewProps>(
  function FadeScrollView({ style, horizontal, ...props }, ref) {
    return (
      <FadeViewport horizontal={Boolean(horizontal)} style={style}>
        <NativeScrollView
          {...props}
          ref={ref}
          horizontal={horizontal}
          style={styles.scroll}
        />
      </FadeViewport>
    );
  },
);

const styles = StyleSheet.create({
  viewport: { flexGrow: 1, flexShrink: 1, overflow: "hidden" },
  scroll: { flexGrow: 1, flexShrink: 1 },
  opaque: { flex: 1, backgroundColor: "black" },
});
