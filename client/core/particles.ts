import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial } from 'three';

import { Engine } from '.';

type ParticlesOptionsType = {
  count: number;
};

const VS = `
uniform float pointMultiplier;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = 0.2 * pointMultiplier / gl_Position.w;
}`;

const FS = `
uniform sampler2D diffuseTexture;

void main() {
  gl_FragColor = texture2D(diffuseTexture, gl_PointCoord);
}
`;

class Particles {
  constructor(public engine: Engine, public options: ParticlesOptionsType) {
    engine.on('ready', () => {
      const geometry = new BufferGeometry();
      const particles = [];
      const positions = [];

      const t = 1;
      for (let i = 0; i <= 10; i++) {
        particles.push({ x: Math.random() * t, y: Math.random() * t, z: Math.random() * t });
      }

      for (const particle of particles) {
        positions.push(particle.x, particle.y, particle.z);
      }

      geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

      const material = new ShaderMaterial({
        uniforms: {
          diffuseTexture: { value: engine.registry.atlasUniform.value },
          pointMultiplier: {
            value: window.innerHeight / (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0)),
          },
        },
        vertexShader: VS,
        fragmentShader: FS,
        blending: AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        vertexColors: true,
      });

      const points = new Points(geometry, material);
      engine.rendering.scene.add(points);
    });
  }
}

export { Particles, ParticlesOptionsType };
