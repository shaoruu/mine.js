attribute float ao;

varying vec2 vUv;
varying float vAO;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  vUv = uv;
  vAO = ao;
} 