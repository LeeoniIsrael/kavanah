import { useAppColorScheme } from "@/design/appearance";
import { brandSymbol, brandWordmark } from "@/design/brand";
import { SvgXml } from "react-native-svg";

export function BrandMark({
  size = 44,
  inverted,
}: {
  size?: number;
  inverted?: boolean;
}): React.JSX.Element {
  const scheme = useAppColorScheme();
  const xml =
    (inverted ?? scheme === "dark")
      ? brandSymbol
          .replaceAll("#0F0F14", "#F2EEE4")
          .replaceAll("#0B1A3B", "#8DB6E8")
      : brandSymbol;
  return (
    <SvgXml
      xml={xml}
      width={(size * 50) / 57}
      height={size}
      accessibilityLabel="Kavanah"
    />
  );
}

export function BrandWordmark({
  width = 152,
  inverted,
}: {
  width?: number;
  inverted?: boolean;
}): React.JSX.Element {
  const scheme = useAppColorScheme();
  const xml =
    (inverted ?? scheme === "dark")
      ? brandWordmark
          .replaceAll("#0F0F14", "#F2EEE4")
          .replaceAll("#0B1A3B", "#8DB6E8")
      : brandWordmark;
  return (
    <SvgXml
      xml={xml}
      width={width}
      height={(width * 65) / 282}
      accessibilityLabel="Kavanah"
    />
  );
}
