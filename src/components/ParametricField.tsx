import { View } from "react-native";
import { BrandMark } from "@/components/BrandMark";

export function ParametricField(): React.JSX.Element {
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="absolute -right-8 top-4 opacity-[0.07]">
      <BrandMark size={230} inverted />
    </View>
  );
}
