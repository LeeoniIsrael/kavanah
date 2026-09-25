import { vars } from "nativewind";
import { palettes } from "./theme";

const semantic = {
  background: "parchment",
  foreground: "ink",
  card: "vellum",
  "card-foreground": "ink",
  popover: "vellum",
  "popover-foreground": "ink",
  primary: "blue",
  "primary-foreground": "onAccent",
  secondary: "mineral",
  "secondary-foreground": "ink",
  muted: "mineral",
  "muted-foreground": "inkMuted",
  accent: "blueSoft",
  "accent-foreground": "blue",
  destructive: "danger",
  "destructive-foreground": "onAccent",
  border: "hairlineStrong",
  input: "hairlineStrong",
  ring: "blue",
} as const;
function hsl(hex: string): string {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const lightness = (max + min) / 2,
    delta = max - min;
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  let hue = 0;
  if (delta) {
    hue =
      max === r
        ? ((g - b) / delta) % 6
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return `${hue} ${saturation * 100}% ${lightness * 100}%`;
}
function variables(palette: typeof palettes.light | typeof palettes.dark) {
  return vars({
    ...Object.fromEntries(
      Object.entries(palette).map(([key, value]) => [`--${key}`, value]),
    ),
    ...Object.fromEntries(
      Object.entries(semantic).map(([key, token]) => [
        `--${key}`,
        hsl(palette[token]),
      ]),
    ),
  });
}
// Inherited through React context, including native modals and portal content.
export const themeVariables = {
  light: variables(palettes.light),
  dark: variables(palettes.dark),
};
