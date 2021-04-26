// terrain generation
export const TERRAIN_CONFIG = {
  // HILLY: { // this was pretty hilly, but decently smooth like MC
  //   SCALE: 0.009,
  //   OCTAVES: 3,
  //   PERSISTANCE: 0.9,
  //   LACUNARITY: 0.3,
  //   HEIGHT_OFFSET: 0.3,
  //   AMPLIFIER: 1.4,
  // },
  HILLY: {
    SCALE: 0.009,
    OCTAVES: 3,
    PERSISTANCE: 0.4,
    LACUNARITY: 0.6,
    HEIGHT_OFFSET: 0.3,
    AMPLIFIER: 1.4,
  },
  // HILLY: {
  //   SCALE: 0.008,
  //   OCTAVES: 8,
  //   PERSISTANCE: 1.6,
  //   LACUNARITY: 1.2,
  //   HEIGHT_OFFSET: 0.5,
  //   AMPLIFIER: 3,
  // },
};

// meshing
export const AO_TABLE = new Uint8Array([100, 170, 210, 255]);

export const FACES = [
  {
    // viewing from -x to +x (head towards +y) (indices):
    // 0 1 2
    // 3 i 4 (i for irrelevant)
    // 5 6 7

    // corners:
    // 0,1,1  0,1,0
    // 0,0,1  0,0,0

    // left
    dir: [-1, 0, 0],
    mat3: 'side', // side
    mat6: 'nx', // nx
    corners: [
      { pos: [0, 1, 0], uv: [0, 1], side1: 1, side2: 3, corner: 0 },
      { pos: [0, 0, 0], uv: [0, 0], side1: 3, side2: 6, corner: 5 },
      { pos: [0, 1, 1], uv: [1, 1], side1: 1, side2: 4, corner: 2 },
      { pos: [0, 0, 1], uv: [1, 0], side1: 4, side2: 6, corner: 7 },
    ],
    neighbors: [
      [-1, 1, -1], // 0
      [-1, 1, 0],
      [-1, 1, 1],
      [-1, 0, -1], // 3
      [-1, 0, 1], // 4
      [-1, -1, -1],
      [-1, -1, 0],
      [-1, -1, 1],
    ],
  },
  {
    // viewing from +x to -x (head towards +y) (indices):
    // 2 1 0
    // 4 i 3 (i for irrelevant)
    // 7 6 5

    // corners:
    // 1,1,1  1,1,0
    // 1,0,1  1,0,0

    // right
    dir: [1, 0, 0],
    mat3: 'side', // side
    mat6: 'px', // px
    corners: [
      { pos: [1, 1, 1], uv: [0, 1], side1: 1, side2: 4, corner: 2 },
      { pos: [1, 0, 1], uv: [0, 0], side1: 4, side2: 6, corner: 7 },
      { pos: [1, 1, 0], uv: [1, 1], side1: 1, side2: 3, corner: 0 },
      { pos: [1, 0, 0], uv: [1, 0], side1: 3, side2: 6, corner: 5 },
    ],
    neighbors: [
      [1, 1, -1], // 0
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, -1], // 3
      [1, 0, 1], // 4
      [1, -1, -1],
      [1, -1, 0],
      [1, -1, 1],
    ],
  },
  {
    // viewing from -y to +y (head towards +z) (indices):
    // 0 1 2
    // 3 i 4 (i for irrelevant)
    // 5 6 7

    // corners:
    // 0,0,1  1,0,1
    // 0,0,0  1,0,0

    // bottom
    dir: [0, -1, 0],
    mat3: 'bottom', // bottom
    mat6: 'ny', // ny
    corners: [
      { pos: [1, 0, 1], uv: [1, 0], side1: 1, side2: 4, corner: 2 },
      { pos: [0, 0, 1], uv: [0, 0], side1: 1, side2: 3, corner: 0 },
      { pos: [1, 0, 0], uv: [1, 1], side1: 4, side2: 6, corner: 7 },
      { pos: [0, 0, 0], uv: [0, 1], side1: 3, side2: 6, corner: 5 },
    ],
    neighbors: [
      [-1, -1, 1],
      [0, -1, 1],
      [1, -1, 1],
      [-1, -1, 0],
      [1, -1, 0],
      [-1, -1, -1],
      [0, -1, -1],
      [1, -1, -1],
    ],
  },
  {
    // viewing from +y to -y (head towards +z) (indices):
    // 2 1 0
    // 4 i 3 (i for irrelevant)
    // 7 6 5

    // corners:
    // 1,1,1  0,1,1
    // 1,1,0  0,1,0

    // top
    dir: [0, 1, 0],
    mat3: 'top', // top
    mat6: 'py', // py
    corners: [
      { pos: [0, 1, 1], uv: [1, 1], side1: 1, side2: 3, corner: 0 },
      { pos: [1, 1, 1], uv: [0, 1], side1: 1, side2: 4, corner: 2 },
      { pos: [0, 1, 0], uv: [1, 0], side1: 3, side2: 6, corner: 5 },
      { pos: [1, 1, 0], uv: [0, 0], side1: 4, side2: 6, corner: 7 },
    ],
    neighbors: [
      [-1, 1, 1],
      [0, 1, 1],
      [1, 1, 1],
      [-1, 1, 0],
      [1, 1, 0],
      [-1, 1, -1],
      [0, 1, -1],
      [1, 1, -1],
    ],
  },
  {
    // viewing from -z to +z (head towards +y) (indices):
    // 0 1 2
    // 3 i 4 (i for irrelevant)
    // 5 6 7

    // corners:
    // 1,1,0  0,1,0
    // 1,0,0  0,0,0

    // back
    dir: [0, 0, -1],
    mat3: 'side', // side
    mat6: 'nz', // nz
    corners: [
      { pos: [1, 0, 0], uv: [0, 0], side1: 3, side2: 6, corner: 5 },
      { pos: [0, 0, 0], uv: [1, 0], side1: 4, side2: 6, corner: 7 },
      { pos: [1, 1, 0], uv: [0, 1], side1: 1, side2: 3, corner: 0 },
      { pos: [0, 1, 0], uv: [1, 1], side1: 1, side2: 4, corner: 2 },
    ],
    neighbors: [
      [1, 1, -1],
      [0, 1, -1],
      [-1, 1, -1],
      [1, 0, -1],
      [-1, 0, -1],
      [1, -1, -1],
      [0, -1, -1],
      [-1, -1, -1],
    ],
  },
  {
    // viewing from +z to -z (head towards +y) (indices):
    // 2 1 0
    // 4 i 3 (i for irrelevant)
    // 7 6 5

    // corners:
    // 0,1,1  1,1,1
    // 0,0,1  1,0,1

    // front
    dir: [0, 0, 1],
    mat3: 'side', // side
    mat6: 'pz', // pz
    corners: [
      { pos: [0, 0, 1], uv: [0, 0], side1: 4, side2: 6, corner: 7 },
      { pos: [1, 0, 1], uv: [1, 0], side1: 3, side2: 6, corner: 5 },
      { pos: [0, 1, 1], uv: [0, 1], side1: 1, side2: 4, corner: 2 },
      { pos: [1, 1, 1], uv: [1, 1], side1: 1, side2: 3, corner: 0 },
    ],
    neighbors: [
      [1, 1, 1],
      [0, 1, 1],
      [-1, 1, 1],
      [1, 0, 1],
      [-1, 0, 1],
      [1, -1, 1],
      [0, -1, 1],
      [-1, -1, 1],
    ],
  },
];
