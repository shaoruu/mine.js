uniform sampler2D uTexture;
uniform vec3 uFogColor;
uniform vec3 uFogNearColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uSunlightIntensity;

varying vec2 vUv; // u, v 
varying float vAO;
varying float vSunlight;
varying float vTorchLight;

void main() {
  vec4 textureColor = texture2D(uTexture, vUv);

  gl_FragColor = vec4(textureColor.rgb * vAO, textureColor.w);
  gl_FragColor.rgb *= min(vTorchLight + vSunlight * uSunlightIntensity, 1.0);

  // fog
  float depth = gl_FragCoord.z / gl_FragCoord.w;
  float fogFactor = smoothstep(uFogNear, uFogFar, depth);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(uFogNearColor, uFogColor, fogFactor), fogFactor);
} 