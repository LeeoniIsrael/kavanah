import { palettes } from "../theme";
function luminance(hex: string) {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
for (const [name, c] of Object.entries(palettes)) {
  test(`${name} text remains readable on all reading surfaces`, () => {
    for (const bg of [c.parchment, c.vellum, c.mineral, c.blueSoft]) {
      expect(contrast(c.ink, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.inkMuted, bg)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(c.onAccent, c.blue)).toBeGreaterThanOrEqual(4.5);
  });
}

for (const [name, c] of Object.entries(palettes)) {
  test(`${name} control glyphs and checkbox outlines remain distinguishable`, () => {
    for (const bg of [c.parchment, c.vellum, c.mineral, c.blueSoft]) {
      expect(contrast(c.inkMuted, bg)).toBeGreaterThanOrEqual(3);
      expect(contrast(c.blue, bg)).toBeGreaterThanOrEqual(3);
    }
    expect(contrast(c.onAccent, c.gold)).toBeGreaterThanOrEqual(3);
  });
}
