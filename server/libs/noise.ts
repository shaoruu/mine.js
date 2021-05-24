import NoiseLib from 'noisejs';

// @ts-ignore
const noise: NoiseLib.Noise = new NoiseLib.Noise(13412);

class Noise {
  public static perlin2 = (x: number, y: number, scale = 1) => noise.perlin2(x * scale, y * scale);

  public static perlin3 = (x: number, y: number, z: number, scale = 1) =>
    noise.perlin3(x * scale, y * scale, z * scale);

  public static simplex2 = (x: number, y: number, scale = 1) => noise.simplex2(x * scale, y * scale);

  public static simplex3 = (x: number, y: number, z: number, scale = 1) =>
    noise.simplex3(x * scale, y * scale, z * scale);

  public static fractalOctavePerlin3 = (x: number, y: number, z: number, scale: number, octaves = 9) => {
    let t = 0,
      f = 1,
      n = 0;
    for (let i = 0; i < octaves; i++) {
      n += noise.perlin3(x * f * scale, y * f * scale, z * f * scale) / f;
      t += 1 / f;
      f *= 2;
    }
    return n / t;
  };

  public static getOctavePerlin3(
    x: number,
    y: number,
    z: number,
    scale: number,
    {
      octaves = 3,
      persistence = 0.6,
      lacunarity = 0.8,
      heightScale = 0.05,
      amplifier = 0.4,
    }: { octaves: number; persistence: number; lacunarity: number; amplifier: number; heightScale: number },
  ) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxVal = 0;

    for (let i = 0; i < octaves; i++) {
      total += noise.perlin3(x * frequency * scale, y * frequency * scale, z * frequency * scale) * amplitude;

      maxVal += amplitude;

      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return (total / maxVal) * amplifier - y * heightScale;
  }
}

export { Noise };
