#![allow(dead_code)]

pub const LEVEL_SEED: u32 = 1021312;

pub struct CornerData {
    pub pos: [i32; 3],
    pub uv: [i32; 2],
    pub side1: u8,
    pub side2: u8,
    pub corner: u8,
}

pub struct CornerSimplified {
    pub pos: [i32; 3],
    pub uv: [i32; 2],
}

pub struct BlockFace<'a> {
    pub dir: [i32; 3],
    pub mat3: &'a str,
    pub mat6: &'a str,
    pub corners: [CornerData; 4],
    pub neighbors: [[i32; 3]; 8],
}

pub struct PlantFace<'a> {
    pub mat: &'a str,
    pub corners: [CornerSimplified; 4],
}

pub const BLOCK_FACES: [BlockFace<'static>; 6] = [
    // viewing from -x to +x (head towards +y) (indices):
    // 0 1 2
    // 3 i 4 (i for irrelevant)
    // 5 6 7

    // corners:
    // 0,1,1  0,1,0
    // 0,0,1  0,0,0

    // left
    BlockFace {
        dir: [-1, 0, 0],
        mat3: "side",
        mat6: "nx",
        corners: [
            CornerData {
                pos: [0, 1, 0],
                uv: [0, 1],
                side1: 1,
                side2: 3,
                corner: 0,
            },
            CornerData {
                pos: [0, 0, 0],
                uv: [0, 0],
                side1: 3,
                side2: 6,
                corner: 5,
            },
            CornerData {
                pos: [0, 1, 1],
                uv: [1, 1],
                side1: 1,
                side2: 4,
                corner: 2,
            },
            CornerData {
                pos: [0, 0, 1],
                uv: [1, 0],
                side1: 4,
                side2: 6,
                corner: 7,
            },
        ],
        neighbors: [
            [-1, 1, -1], // 0
            [-1, 1, 0],
            [-1, 1, 1],
            [-1, 0, -1], // 3
            [-1, 0, 1],  // 4
            [-1, -1, -1],
            [-1, -1, 0],
            [-1, -1, 1],
        ],
    },
    // viewing from +x to -x (head towards +y) (indices):
    // 2 1 0
    // 4 i 3 (i for irrelevant)
    // 7 6 5

    // corners:
    // 1,1,1  1,1,0
    // 1,0,1  1,0,0

    // right
    BlockFace {
        dir: [1, 0, 0],
        mat3: "side",
        mat6: "px",
        corners: [
            CornerData {
                pos: [1, 1, 1],
                uv: [0, 1],
                side1: 1,
                side2: 4,
                corner: 2,
            },
            CornerData {
                pos: [1, 0, 1],
                uv: [0, 0],
                side1: 4,
                side2: 6,
                corner: 7,
            },
            CornerData {
                pos: [1, 1, 0],
                uv: [1, 1],
                side1: 1,
                side2: 3,
                corner: 0,
            },
            CornerData {
                pos: [1, 0, 0],
                uv: [1, 0],
                side1: 3,
                side2: 6,
                corner: 5,
            },
        ],
        neighbors: [
            [1, 1, -1], // 0
            [1, 1, 0],
            [1, 1, 1],
            [1, 0, -1], // 3
            [1, 0, 1],  // 4
            [1, -1, -1],
            [1, -1, 0],
            [1, -1, 1],
        ],
    },
    // viewing from -y to +y (head towards +z) (indices):
    // 0 1 2
    // 3 i 4 (i for irrelevant)
    // 5 6 7

    // corners:
    // 0,0,1  1,0,1
    // 0,0,0  1,0,0

    // bottom
    BlockFace {
        dir: [0, -1, 0],
        mat3: "bottom",
        mat6: "ny",
        corners: [
            CornerData {
                pos: [1, 0, 1],
                uv: [1, 0],
                side1: 1,
                side2: 4,
                corner: 2,
            },
            CornerData {
                pos: [0, 0, 1],
                uv: [0, 0],
                side1: 1,
                side2: 3,
                corner: 0,
            },
            CornerData {
                pos: [1, 0, 0],
                uv: [1, 1],
                side1: 4,
                side2: 6,
                corner: 7,
            },
            CornerData {
                pos: [0, 0, 0],
                uv: [0, 1],
                side1: 3,
                side2: 6,
                corner: 5,
            },
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
    // viewing from -y to +y (head towards +z) (indices):
    // 0 1 2
    // 3 i 4 (i for irrelevant)
    // 5 6 7

    // corners:
    // 0,0,1  1,0,1
    // 0,0,0  1,0,0

    // bottom
    BlockFace {
        dir: [0, 1, 0],
        mat3: "top",
        mat6: "py",
        corners: [
            CornerData {
                pos: [0, 1, 1],
                uv: [1, 1],
                side1: 1,
                side2: 3,
                corner: 0,
            },
            CornerData {
                pos: [1, 1, 1],
                uv: [0, 1],
                side1: 1,
                side2: 4,
                corner: 2,
            },
            CornerData {
                pos: [0, 1, 0],
                uv: [1, 0],
                side1: 3,
                side2: 6,
                corner: 5,
            },
            CornerData {
                pos: [1, 1, 0],
                uv: [0, 0],
                side1: 4,
                side2: 6,
                corner: 7,
            },
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
    // viewing from -z to +z (head towards +y) (indices):
    // 0 1 2
    // 3 i 4 (i for irrelevant)
    // 5 6 7

    // corners:
    // 1,1,0  0,1,0
    // 1,0,0  0,0,0

    // back
    BlockFace {
        dir: [0, 0, -1],
        mat3: "side",
        mat6: "nz",
        corners: [
            CornerData {
                pos: [1, 0, 0],
                uv: [0, 0],
                side1: 3,
                side2: 6,
                corner: 5,
            },
            CornerData {
                pos: [0, 0, 0],
                uv: [1, 0],
                side1: 4,
                side2: 6,
                corner: 7,
            },
            CornerData {
                pos: [1, 1, 0],
                uv: [0, 1],
                side1: 1,
                side2: 3,
                corner: 0,
            },
            CornerData {
                pos: [0, 1, 0],
                uv: [1, 1],
                side1: 1,
                side2: 4,
                corner: 2,
            },
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
    // viewing from +z to -z (head towards +y) (indices):
    // 2 1 0
    // 4 i 3 (i for irrelevant)
    // 7 6 5

    // corners:
    // 0,1,1  1,1,1
    // 0,0,1  1,0,1

    // front
    BlockFace {
        dir: [0, 0, 1],
        mat3: "side",
        mat6: "pz",
        corners: [
            CornerData {
                pos: [0, 0, 1],
                uv: [0, 0],
                side1: 4,
                side2: 6,
                corner: 7,
            },
            CornerData {
                pos: [1, 0, 1],
                uv: [1, 0],
                side1: 3,
                side2: 6,
                corner: 5,
            },
            CornerData {
                pos: [0, 1, 1],
                uv: [0, 1],
                side1: 1,
                side2: 4,
                corner: 2,
            },
            CornerData {
                pos: [1, 1, 1],
                uv: [1, 1],
                side1: 1,
                side2: 3,
                corner: 0,
            },
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

pub const PLANT_FACES: [PlantFace; 2] = [
    PlantFace {
        // diagonal 1
        mat: "one",
        corners: [
            CornerSimplified {
                pos: [0, 1, 0],
                uv: [0, 1],
            },
            CornerSimplified {
                pos: [0, 0, 0],
                uv: [0, 0],
            },
            CornerSimplified {
                pos: [1, 1, 1],
                uv: [1, 1],
            },
            CornerSimplified {
                pos: [1, 0, 1],
                uv: [1, 0],
            },
        ],
    },
    PlantFace {
        // diagonal 2
        mat: "two",
        corners: [
            CornerSimplified {
                pos: [1, 1, 0],
                uv: [0, 1],
            },
            CornerSimplified {
                pos: [1, 0, 0],
                uv: [0, 0],
            },
            CornerSimplified {
                pos: [0, 1, 1],
                uv: [1, 1],
            },
            CornerSimplified {
                pos: [0, 0, 1],
                uv: [1, 0],
            },
        ],
    },
];

pub const VOXEL_NEIGHBORS: [[i32; 3]; 6] = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 0, -1],
    [0, 1, 0],
    [0, -1, 0],
];

pub const CHUNK_NEIGHBORS: [[i32; 2]; 8] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
];

pub const CHUNK_HORIZONTAL_NEIGHBORS: [[i32; 2]; 4] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

pub const DATA_PADDING: usize = 1;
