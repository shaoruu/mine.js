#include <fog_fragment>

uniform sampler2D uTexture;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec2 vUv; // u, v 
varying float vAO;

void main() {
  vec4 textureColor = texture2D(uTexture, vUv);

  gl_FragColor = vec4(textureColor.xyz * vAO, textureColor.w);

  #ifdef USE_FOG
    #ifdef USE_LOGDEPTHBUF_EXT
      float depth = gl_FragDepthEXT / gl_FragCoord.w;
    #else
      float depth = gl_FragCoord.z / gl_FragCoord.w;
    #endif
    float fogFactor = smoothstep( uFogNear, uFogFar, depth );
    gl_FragColor.rgb = mix( gl_FragColor.rgb, uFogColor, fogFactor );
  #endif
} 