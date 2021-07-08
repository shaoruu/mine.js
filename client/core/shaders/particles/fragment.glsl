uniform sampler2D diffuseTexture;
uniform float sunlightIntensity;
uniform vec2 repeat;

varying vec2 vUv;
varying vec4 vLights;

void main() {
  vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
  gl_FragColor = texture2D(diffuseTexture, uv * repeat + vUv);
  float s = max(vLights.w * sunlightIntensity, 0.1);
  gl_FragColor.rgb *= vec3(s + vLights.r, s + vLights.g, s + vLights.b);
}