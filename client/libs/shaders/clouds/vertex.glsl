varying vec3 eyenorm;

void main() {
	eyenorm = -normal;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}