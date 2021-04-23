uniform sampler2D uTexture;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec2 vUv; // u, v 
varying float vAO;
varying float vSunlight;
varying float vTorchLight;

void main() {
  vec4 textureColor = texture2D(uTexture, vUv);

  gl_FragColor = vec4(textureColor.rgb, textureColor.w);
  gl_FragColor.rgb *= min((vSunlight + vTorchLight) / 16.0 + 0.2, 1.0) * vAO;

  // fog
  float depth = gl_FragCoord.z / gl_FragCoord.w;
  float fogFactor = smoothstep( uFogNear, uFogFar, depth );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, uFogColor, fogFactor );
} 