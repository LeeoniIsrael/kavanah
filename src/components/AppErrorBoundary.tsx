import { Component, Fragment, type ErrorInfo, type PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { colors, radii, spacing, type } from "@/design/theme";

type State = {
  hasError: boolean;
  recoveryKey: number;
};

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false, recoveryKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Kavanah render failure", error.message, info.componentStack);
  }

  private retry = (): void => {
    this.setState((state) => ({ hasError: false, recoveryKey: state.recoveryKey + 1 }));
  };

  render(): React.JSX.Element {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.rule} />
            <Text style={styles.eyebrow}>Kavanah</Text>
            <Text accessibilityRole="header" style={styles.title}>Let&apos;s begin again</Text>
            <Text style={styles.body}>Your saved prayers and practice history remain on this device.</Text>
            <AnimatedPressable accessibilityLabel="Try opening Kavanah again" accessibilityRole="button" haptic="confirm" onPress={this.retry} style={styles.button}>
              <Text style={styles.buttonText}>Try again</Text>
            </AnimatedPressable>
          </View>
        </SafeAreaView>
      );
    }

    return <Fragment key={this.state.recoveryKey}>{this.props.children}</Fragment>;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.parchment
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.xl
  },
  rule: {
    width: 32,
    height: 2,
    backgroundColor: colors.gold,
    marginBottom: spacing.sm
  },
  eyebrow: {
    ...type.caption,
    color: colors.inkMuted
  },
  title: {
    ...type.title,
    color: colors.ink
  },
  body: {
    ...type.body,
    color: colors.inkMuted,
    maxWidth: 330
  },
  button: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.blue,
    marginTop: spacing.sm
  },
  buttonText: {
    ...type.body,
    color: colors.white,
    fontWeight: "600"
  }
});
