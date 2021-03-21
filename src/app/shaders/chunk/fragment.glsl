uniform sampler2D uTexture;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec2 vUv; // u, v 
varying float vAO;
varying float vLight;

void main() {
  vec4 textureColor = texture2D(uTexture, vUv);

  gl_FragColor = vec4(textureColor.rgb * vAO, textureColor.w);
  gl_FragColor.rgb *= min(vLight / 16.0 + 0.2, 1.0);

  // fog
  float depth = gl_FragCoord.z / gl_FragCoord.w;
  float fogFactor = smoothstep( uFogNear, uFogFar, depth );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, uFogColor, fogFactor );
} 