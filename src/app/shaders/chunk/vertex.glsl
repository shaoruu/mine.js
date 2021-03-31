attribute float ao;
attribute float sunlight;
attribute float torchLight;

varying vec2 vUv;
varying float vAO;
varying float vSunlight;
varying float vTorchLight;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  vUv = uv;
  vAO = ao;
  vSunlight = sunlight;
  vTorchLight = torchLight;
} 