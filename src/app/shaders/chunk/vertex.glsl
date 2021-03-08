attribute vec2 uvs;

varying vec2 vUvs;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  vUvs = uvs;
}