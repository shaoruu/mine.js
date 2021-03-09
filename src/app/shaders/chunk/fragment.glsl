uniform sampler2D uTexture;

varying vec2 vUv; // u, v 
varying float vAO;

void main() {
  vec4 textureColor = texture2D(uTexture, vUv);

  textureColor = textureColor * vAO;

  gl_FragColor = textureColor;
} 