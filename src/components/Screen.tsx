import type { ReactNode } from "react";

import { BrandWordmark } from "@/components/BrandMark";
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
    <AnimatedHeaderScrollView
      leftComponent={<BrandWordmark width={104} />}
      {...props}
    >
      {children}
    </AnimatedHeaderScrollView>
  );
}
