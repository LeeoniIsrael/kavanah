import { SvgXml } from "react-native-svg";
import { brandSymbol, brandWordmark } from "@/design/brand";

export function BrandMark({ size = 44, inverted = true }: { size?: number; inverted?: boolean }): React.JSX.Element {
  const xml = inverted ? brandSymbol.replaceAll("#0F0F14", "#F2EEE4").replaceAll("#0B1A3B", "#4A86E8") : brandSymbol;
  return <SvgXml xml={xml} width={size * 50 / 57} height={size} accessibilityLabel="Kavanah" />;
}

export function BrandWordmark({ width = 152, inverted = true }: { width?: number; inverted?: boolean }): React.JSX.Element {
  const xml = inverted ? brandWordmark.replaceAll("#0F0F14", "#F2EEE4").replaceAll("#0B1A3B", "#4A86E8") : brandWordmark;
  return <SvgXml xml={xml} width={width} height={width * 65 / 282} accessibilityLabel="Kavanah" />;
}
