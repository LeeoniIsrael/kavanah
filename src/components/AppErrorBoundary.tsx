import { BrandWordmark } from "@/components/BrandMark";
import { Text } from "@/components/ui/text";
import {
  Component,
  Fragment,
  type ErrorInfo,
  type PropsWithChildren,
} from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";

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
    this.setState((state) => ({
      hasError: false,
      recoveryKey: state.recoveryKey + 1,
    }));
  };

  render(): React.JSX.Element {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1 justify-center items-start gap-3 p-6">
            <BrandWordmark width={170} />
            <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-muted-foreground font-label">
              Kavanah
            </Text>
            <Text
              accessibilityRole="header"
              className="text-[27px] leading-[33px] font-semibold tracking-normal text-foreground font-heading"
            >
              Let&apos;s begin again
            </Text>
            <Text className="text-[16px] leading-[22px] font-normal tracking-normal text-muted-foreground max-w-[330px] font-body">
              Your saved prayers and practice history remain on this device.
            </Text>
            <Button
              variant="default"
              size="content"
              accessibilityLabel="Try opening Kavanah again"
              accessibilityRole="button"
              haptic="confirm"
              onPress={this.retry}
              className="min-h-12 justify-center items-center px-6 rounded-md bg-primary mt-2"
            >
              <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-white font-heading">
                Try again
              </Text>
            </Button>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <Fragment key={this.state.recoveryKey}>{this.props.children}</Fragment>
    );
  }
}
