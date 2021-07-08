uniform float pointMultiplier;

attribute vec4 lights;

varying vec2 vUv;
varying vec4 vLights;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = 0.2 * pointMultiplier / gl_Position.w;
  
  vUv = uv;
  vLights = lights;
}
