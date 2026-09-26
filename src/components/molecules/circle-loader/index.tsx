import { PulsingDots } from "@/components/molecules/pulsing-dots";
import { colors } from "@/design/theme";
import type { CircleLoadingIndicatorProps } from "./types";
/** Keep existing loading call sites on the shared pulsing animation. */
export function CircleLoadingIndicator({
  dotColor = colors.blue,
  dotRadius = 3,
  dotSpacing = 5,
  duration = 800,
  style,
}: CircleLoadingIndicatorProps): React.JSX.Element {
  return (
    <PulsingDots
      color={dotColor}
      radius={dotRadius}
      spacing={dotSpacing}
      duration={duration}
      style={style}
    />
  );
}

export type { CircleLoadingIndicatorProps } from "./types";
