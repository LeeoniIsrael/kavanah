import { HStack, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  background,
  containerBackground,
  cornerRadius,
  font,
  foregroundStyle,
  lineLimit,
  padding,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

export type NextPrayerWidgetProps = {
  momentLabel: string;
  title: string;
  time: string;
  timeAt: number | null;
  detail: string;
  action: string;
  url: string;
  appearance: "system" | "light" | "dark";
  colors: {
    light: WidgetColors;
    dark: WidgetColors;
  };
};

type WidgetColors = {
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  onAccent: string;
};

function NextPrayerWidget(
  props: NextPrayerWidgetProps,
  environment: WidgetEnvironment,
): React.JSX.Element {
  "widget";

  const dark =
    props.appearance === "dark" ||
    (props.appearance === "system" && environment.colorScheme === "dark");
  const { surface, ink, muted, accent, onAccent } = dark
    ? props.colors.dark
    : props.colors.light;
  const timeSize = environment.widgetFamily === "systemSmall" ? 26 : 40;
  const titleSize = environment.widgetFamily === "systemSmall" ? 19 : 25;

  if (environment.widgetFamily === "systemSmall") {
    return (
      <VStack
        alignment="leading"
        spacing={4}
        modifiers={[
          padding({ all: 12 }),
          background(surface),
          cornerRadius(32),
          containerBackground(surface, "widget"),
          widgetURL(props.url),
        ]}
      >
        <HStack alignment="center" spacing={0}>
          <Text
            modifiers={[
              font({ family: "Manrope", size: 10, weight: "semibold" }),
              foregroundStyle(muted),
              lineLimit(1),
            ]}
          >
            {props.momentLabel.toUpperCase()}
          </Text>
          <Spacer />
          {props.timeAt !== null ? (
            <Text
              date={new Date(props.timeAt)}
              dateStyle="relative"
              modifiers={[
                font({ family: "Manrope", size: 11, weight: "medium" }),
                foregroundStyle(muted),
                lineLimit(1),
              ]}
            />
          ) : null}
        </HStack>
        <Text
          modifiers={[
            font({ family: "Georgia", size: titleSize }),
            foregroundStyle(ink),
            lineLimit(2),
          ]}
        >
          {props.title}
        </Text>
        <Spacer />
        <HStack
          alignment="center"
          spacing={0}
          modifiers={[
            padding({ horizontal: 10, vertical: 6 }),
            background(accent),
            cornerRadius(18),
          ]}
        >
          <Text
            modifiers={[
              font({ family: "Manrope", size: 12, weight: "semibold" }),
              foregroundStyle(onAccent),
              lineLimit(1),
            ]}
          >
            {props.action}
          </Text>
        </HStack>
      </VStack>
    );
  }

  return (
    <HStack
      alignment="center"
      spacing={12}
      modifiers={[
        padding({ all: 20 }),
        background(surface),
        cornerRadius(32),
        containerBackground(surface, "widget"),
        widgetURL(props.url),
      ]}
    >
      <VStack alignment="leading" spacing={8}>
        <Text
          modifiers={[
            font({ family: "Manrope", size: 11, weight: "semibold" }),
            foregroundStyle(muted),
            lineLimit(1),
          ]}
        >
          {props.momentLabel.toUpperCase()}
        </Text>
        <Text
          modifiers={[
            font({ family: "Georgia", size: titleSize }),
            foregroundStyle(ink),
            lineLimit(2),
          ]}
        >
          {props.title}
        </Text>
        <Text
          modifiers={[
            font({ family: "Manrope", size: 13, weight: "regular" }),
            foregroundStyle(muted),
            lineLimit(2),
          ]}
        >
          {props.detail}
        </Text>
      </VStack>
      <Spacer />
      <VStack alignment="trailing" spacing={12}>
        {props.time ? (
          <Text
            modifiers={[
              font({ family: "Manrope", size: timeSize, weight: "regular" }),
              foregroundStyle(ink),
              lineLimit(1),
            ]}
          >
            {props.time}
          </Text>
        ) : null}
        {props.timeAt !== null ? (
          <Text
            date={new Date(props.timeAt)}
            dateStyle="relative"
            modifiers={[
              font({ family: "Manrope", size: 12, weight: "medium" }),
              foregroundStyle(muted),
              lineLimit(1),
            ]}
          />
        ) : null}
        <HStack
          alignment="center"
          spacing={0}
          modifiers={[
            padding({ horizontal: 14, vertical: 10 }),
            background(accent),
            cornerRadius(18),
          ]}
        >
          <Text
            modifiers={[
              font({ family: "Manrope", size: 13, weight: "semibold" }),
              foregroundStyle(onAccent),
              lineLimit(1),
            ]}
          >
            {props.action}
          </Text>
        </HStack>
      </VStack>
    </HStack>
  );
}

export default createWidget("KavanahNextPrayerWidget", NextPrayerWidget);
