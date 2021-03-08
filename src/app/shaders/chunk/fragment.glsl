uniform sampler2D uTexture;

varying vec2 vUvs; // u, v 

void main() {
  vec4 textureColor = texture2D(uTexture, vUvs);

  gl_FragColor = textureColor;
}