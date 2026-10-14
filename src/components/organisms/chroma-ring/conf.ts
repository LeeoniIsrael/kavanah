// Rounded-rectangle distance keeps the glow confined to the border.
export const SHADER_SOURCE = `
  uniform float2 iResolution;
  uniform float progress;
  uniform float borderRadius;
  uniform float borderWidth;
  uniform float3 baseColor;
  uniform float3 glowColor;

  float roundedRect(float2 p, float2 halfSize, float radius) {
    float2 q = abs(p) - halfSize + radius;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
  }

  half4 main(float2 xy) {
    float2 halfSize = iResolution * 0.5;
    float2 p = xy - halfSize;
    float radius = min(borderRadius, min(halfSize.x, halfSize.y));
    float distance = roundedRect(p, halfSize - 0.5, max(radius - 0.5, 0.0));
    float outer = 1.0 - smoothstep(-0.5, 0.5, distance);
    float inner = smoothstep(-borderWidth - 0.5, -borderWidth + 0.5, distance);
    float alpha = outer * inner;
    float angle = atan(p.y / halfSize.y, p.x / halfSize.x);
    // Periodic waves meet seamlessly when progress wraps back to zero.
    float wave = 0.5 + 0.5 * cos(angle - progress * 6.2831853);
    float flowingGlow = pow(wave, 6.0);
    float3 color = mix(baseColor, glowColor, flowingGlow * 0.65);
    return half4(color * alpha, alpha);
  }
`;
