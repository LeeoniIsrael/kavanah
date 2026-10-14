import Constants from "expo-constants";
import * as Application from "expo-application";
import { Text } from "@/components/ui/text";

export function BuildIdentity({ color }: { color?: string } = {}): React.JSX.Element {
  const config = Constants.expoConfig;
  const revision = String(config?.extra?.buildRevision ?? "local").slice(0, 7);
  const build = Application.nativeBuildVersion ?? config?.ios?.buildNumber ?? "local";
  return <Text variant="caption" style={color ? { color } : undefined} accessibilityLabel={`Kavanah build ${build}, revision ${revision}`}>
    {config?.extra?.buildLabel ?? "Kavanah"} · Build {build} · {revision}
  </Text>;
}
