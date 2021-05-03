uniform vec3 uFogColor;
uniform vec3 uFogNearColor;
uniform vec3 uCloudColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uCloudAlpha;

varying vec3 eyenorm;

void main() {
  gl_FragColor = vec4(uCloudColor, uCloudAlpha);

  vec3 dirLight = vec3(0, 1.0, 0);
  float ndotl = dot(normalize(eyenorm), normalize(dirLight));
  
  if (ndotl > 0.8) {
    ndotl = 1.0;
  } else if (ndotl > 0.6) {
    ndotl = 0.9;
  } else {
    ndotl = 0.8;
  }

  gl_FragColor.rgb *= ndotl;

  // fog
  float depth = gl_FragCoord.z / gl_FragCoord.w;
  float fogFactor = smoothstep(uFogNear, uFogFar, depth);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(uFogNearColor, uFogColor, fogFactor), fogFactor);

}