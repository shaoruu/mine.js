uniform vec3 uFogColor;
uniform vec3 uFogNearColor;
uniform vec3 uCloudColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uCloudAlpha;

void main() {
  gl_FragColor = vec4(uCloudColor, uCloudAlpha);

  // fog
  float depth = gl_FragCoord.z / gl_FragCoord.w;
  float fogFactor = smoothstep(uFogNear, uFogFar, depth);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(uFogNearColor, uFogColor, fogFactor), fogFactor);
}