import type { ReactNode } from "react";

import {
  AnimatedHeaderScrollView,
  type AnimatedHeaderScrollViewProps,
} from "@/components/organisms/animated-header-scrollview";

type ScreenProps = Omit<
  AnimatedHeaderScrollViewProps,
  "children" | "leftComponent"
> & {
  children: ReactNode;
};

export function Screen({ children, ...props }: ScreenProps): React.JSX.Element {
  return (
    <AnimatedHeaderScrollView {...props}>
      {children}
    </AnimatedHeaderScrollView>
  );
}
