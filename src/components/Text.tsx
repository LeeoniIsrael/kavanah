import type { PropsWithChildren } from "react";
import { Text as RNText, type TextProps } from "react-native";

export function Title({ children, className = "", ...props }: PropsWithChildren<TextProps & { className?: string }>): React.JSX.Element {
  return (
    <RNText className={`text-4xl font-semibold leading-tight text-ink ${className}`} {...props}>
      {children}
    </RNText>
  );
}

export function Body({ children, className = "", ...props }: PropsWithChildren<TextProps & { className?: string }>): React.JSX.Element {
  return (
    <RNText className={`text-base leading-7 text-ink/75 ${className}`} {...props}>
      {children}
    </RNText>
  );
}

export function Label({ children, className = "", ...props }: PropsWithChildren<TextProps & { className?: string }>): React.JSX.Element {
  return (
    <RNText className={`text-xs font-semibold uppercase tracking-[1px] text-ink/50 ${className}`} {...props}>
      {children}
    </RNText>
  );
}
