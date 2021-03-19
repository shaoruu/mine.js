attribute float ao;
attribute float light;

varying vec2 vUv;
varying float vAO;
varying float vLight;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  vUv = uv;
  vAO = ao;
  vLight = light;
} 