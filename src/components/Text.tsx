import type { PropsWithChildren } from "react";
import { StyleSheet, Text as RNText, type TextProps } from "react-native";

import { colors, type } from "@/design/theme";

export function Title({ children, style, ...props }: PropsWithChildren<TextProps>): React.JSX.Element {
  return (
    <RNText style={[styles.title, style]} {...props}>
      {children}
    </RNText>
  );
}

export function Display({ children, style, ...props }: PropsWithChildren<TextProps>): React.JSX.Element {
  return (
    <RNText style={[styles.display, style]} {...props}>
      {children}
    </RNText>
  );
}

export function Body({ children, style, ...props }: PropsWithChildren<TextProps>): React.JSX.Element {
  return (
    <RNText style={[styles.body, style]} {...props}>
      {children}
    </RNText>
  );
}

export function Label({ children, style, ...props }: PropsWithChildren<TextProps>): React.JSX.Element {
  return (
    <RNText style={[styles.label, style]} {...props}>
      {children}
    </RNText>
  );
}

export function SectionTitle({ children, style, ...props }: PropsWithChildren<TextProps>): React.JSX.Element {
  return (
    <RNText style={[styles.section, style]} {...props}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  display: {
    ...type.display,
    color: colors.ink
  },
  title: {
    ...type.title,
    color: colors.ink
  },
  section: {
    ...type.section,
    color: colors.ink
  },
  body: {
    ...type.body,
    color: colors.inkMuted
  },
  label: {
    ...type.caption,
    color: colors.gold,
    textTransform: "uppercase"
  }
});
