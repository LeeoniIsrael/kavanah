export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0.4, 0.9, 0.98];

  return [
    parseInt(result[1]!, 16) / 255,
    parseInt(result[2]!, 16) / 255,
    parseInt(result[3]!, 16) / 255,
  ];
}

export function createDotShaderSource(
  spacing: number,
  dotRadius: number,
  opacity: number,
): string {
  return `
    uniform float2 iResolution;
    uniform float angle;

    half4 main(float2 fragCoord) {
      float spacing = ${spacing.toFixed(1)};
      float dotRadius = ${dotRadius.toFixed(2)};
      float2 grid = mod(fragCoord, spacing);
      float distanceToDot = length(
        grid - float2(spacing * 0.5, spacing * 0.5)
      );
      float dot = 1.0 - smoothstep(
        dotRadius - 0.3,
        dotRadius + 0.1,
        distanceToDot
      );
      float2 direction = fragCoord - iResolution * 0.5;
      float normalizedAngle = (atan(direction.y, direction.x) + 3.14159265) /
        6.28318530;
      float rotation = fract(normalizedAngle - angle / 6.28318530 - 0.125);
      float mask = (1.0 - smoothstep(0.0, 0.12, rotation)) +
        smoothstep(0.88, 1.0, rotation);

      return half4(1.0, 1.0, 1.0, dot * mask * ${opacity.toFixed(2)});
    }
  `;
}
