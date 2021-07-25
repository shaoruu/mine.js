use std::f32;

/// Base class to extract voxel data from a single u32
///
/// Bit lineup as such (from right to left):
/// - `1 - 16 bits`: ID (0x0000FFFF)
/// - `17 - 20 bit`: rotation (0x000F0000)
/// - `21 - 24 bit`: y rotation (0x00F00000)
/// - `25 - 32 bit`: stage (0x0F000000)

const PY_ROTATION: u32 = 0;
const NY_ROTATION: u32 = 1;
const PX_ROTATION: u32 = 2;
const NX_ROTATION: u32 = 3;
const PZ_ROTATION: u32 = 4;
const NZ_ROTATION: u32 = 5;

const Y_000_ROTATION: u32 = 0;
const Y_045_ROTATION: u32 = 1;
const Y_090_ROTATION: u32 = 2;
const Y_135_ROTATION: u32 = 3;
const Y_180_ROTATION: u32 = 4;
const Y_225_ROTATION: u32 = 5;
const Y_270_ROTATION: u32 = 6;
const Y_315_ROTATION: u32 = 7;

const ROTATION_MASK: u32 = 0xFFF0FFFF;
const Y_ROTATION_MASK: u32 = 0xFF0FFFFF;
const STAGE_MASK: u32 = 0xF0FFFFFF;

/// 6 possible rotations: (px, nx, py, ny, pz, nz)
///
/// Default rotation is PY
#[derive(PartialEq, Eq, Debug)]
pub enum BlockRotation {
    PX(u32),
    NX(u32),
    PY(u32),
    NY(u32),
    PZ(u32),
    NZ(u32),
}

const PI_2: f32 = f32::consts::PI / 2.0;

impl BlockRotation {
    pub fn encode(value: u32, y_rotation: u32) -> Self {
        let y_rotation = match y_rotation {
            Y_000_ROTATION => 0,
            Y_045_ROTATION => 45,
            Y_090_ROTATION => 90,
            Y_135_ROTATION => 135,
            Y_180_ROTATION => 180,
            Y_225_ROTATION => 225,
            Y_270_ROTATION => 270,
            Y_315_ROTATION => 315,
            _ => panic!("Unable to decode y-rotation: unknown rotation."),
        };

        match value {
            PX_ROTATION => BlockRotation::PX(y_rotation),
            NX_ROTATION => BlockRotation::NX(y_rotation),
            PY_ROTATION => BlockRotation::PY(y_rotation),
            NY_ROTATION => BlockRotation::NY(y_rotation),
            PZ_ROTATION => BlockRotation::PZ(y_rotation),
            NZ_ROTATION => BlockRotation::NZ(y_rotation),
            _ => panic!("Unknown rotation: {}", value),
        }
    }

    pub fn decode(rotation: &Self) -> (u32, u32) {
        let convert_y_rot = |val: u32| match val {
            0 => Y_000_ROTATION,
            45 => Y_045_ROTATION,
            90 => Y_090_ROTATION,
            135 => Y_135_ROTATION,
            180 => Y_180_ROTATION,
            225 => Y_225_ROTATION,
            270 => Y_270_ROTATION,
            315 => Y_315_ROTATION,
            _ => panic!("Unable to encode y-rotation: unknown y-rotation."),
        };

        match rotation {
            BlockRotation::PX(rot) => (PX_ROTATION, convert_y_rot(*rot)),
            BlockRotation::NX(rot) => (NX_ROTATION, convert_y_rot(*rot)),
            BlockRotation::PY(rot) => (PY_ROTATION, convert_y_rot(*rot)),
            BlockRotation::NY(rot) => (NY_ROTATION, convert_y_rot(*rot)),
            BlockRotation::PZ(rot) => (PZ_ROTATION, convert_y_rot(*rot)),
            BlockRotation::NZ(rot) => (NZ_ROTATION, convert_y_rot(*rot)),
        }
    }

    pub fn rotate(&self, node: &mut [f32; 3], translate: bool) {
        match self {
            BlockRotation::PX(rot) => {
                if *rot != 0 {
                    self.rotate_y(node, *rot as f32);
                }

                self.rotate_z(node, -PI_2);

                if translate {
                    node[1] += 1.0;
                }
            }
            BlockRotation::NX(rot) => {
                if *rot != 0 {
                    self.rotate_y(node, *rot as f32);
                }

                self.rotate_z(node, PI_2);

                if translate {
                    node[0] += 1.0;
                }
            }
            BlockRotation::PY(rot) => {
                if *rot != 0 {
                    self.rotate_y(node, *rot as f32);
                }
            }
            BlockRotation::NY(rot) => {
                if *rot != 0 {
                    self.rotate_y(node, *rot as f32);
                }

                self.rotate_x(node, PI_2 * 2.0);

                if translate {
                    node[1] += 1.0;
                    node[2] += 1.0;
                }
            }
            BlockRotation::PZ(rot) => {
                if *rot != 0 {
                    self.rotate_y(node, *rot as f32);
                }

                self.rotate_x(node, PI_2);

                if translate {
                    node[1] += 1.0;
                }
            }
            BlockRotation::NZ(rot) => {
                if *rot != 0 {
                    self.rotate_y(node, *rot as f32);
                }

                self.rotate_x(node, -PI_2);

                if translate {
                    node[2] += 1.0;
                }
            }
        }
    }

    pub fn rotate_inv(&self, node: &mut [f32; 3], translate: bool) {
        match self {
            BlockRotation::PX(rot) => BlockRotation::NX(*rot).rotate(node, translate),
            BlockRotation::NX(rot) => BlockRotation::PX(*rot).rotate(node, translate),
            BlockRotation::PY(rot) => BlockRotation::NY(*rot).rotate(node, translate),
            BlockRotation::NY(rot) => BlockRotation::PY(*rot).rotate(node, translate),
            BlockRotation::PZ(rot) => BlockRotation::NZ(*rot).rotate(node, translate),
            BlockRotation::NZ(rot) => BlockRotation::PZ(*rot).rotate(node, translate),
        }
    }

    // Learned from
    // https://www.khanacademy.org/computer-programming/cube-rotated-around-x-y-and-z/4930679668473856

    fn rotate_x(&self, node: &mut [f32; 3], theta: f32) {
        let sin_theta = theta.sin();
        let cos_theta = theta.cos();

        let y = node[1];
        let z = node[2];

        node[1] = y * cos_theta - z * sin_theta;
        node[2] = z * cos_theta + y * sin_theta;
    }

    fn rotate_z(&self, node: &mut [f32; 3], theta: f32) {
        let sin_theta = theta.sin();
        let cos_theta = theta.cos();

        let x = node[0];
        let y = node[1];

        node[0] = x * cos_theta - y * sin_theta;
        node[1] = y * cos_theta + x * sin_theta;
    }

    fn rotate_y(&self, node: &mut [f32; 3], theta: f32) {
        let sin_theta = theta.sin();
        let cos_theta = theta.cos();

        let x = node[0];
        let z = node[2];

        node[0] = x * cos_theta + z * sin_theta;
        node[2] = z * cos_theta - x * sin_theta;
    }
}

pub struct Blocks;

impl Blocks {
    /// Extract the bits in voxel that stores the voxel id
    #[inline]
    pub fn extract_id(voxel: u32) -> u32 {
        voxel & 0xFFFF
    }

    /// Insert a voxel id into voxel value
    #[inline]
    pub fn insert_id(voxel: u32, id: u32) -> u32 {
        (voxel & 0xFFFF0000) | (id & 0xFFFF)
    }

    /// Extract the bits in voxel that stores the voxel rotation
    #[inline]
    pub fn extract_rotation(voxel: u32) -> BlockRotation {
        let rotation = (voxel >> 16) & 0xF;
        let y_rot = (voxel >> 20) & 0xF;
        BlockRotation::encode(rotation, y_rot)
    }

    /// Insert a voxel rotation into voxel value
    #[inline]
    pub fn insert_rotation(voxel: u32, rotation: &BlockRotation) -> u32 {
        let (rotation, y_rot) = BlockRotation::decode(rotation);
        let value = (voxel & ROTATION_MASK) | ((rotation & 0xF) << 16);
        (value & Y_ROTATION_MASK) | ((y_rot & 0xF) << 20)
    }

    /// Extract the bits in voxel that stores the stage value
    #[inline]
    pub fn extract_stage(voxel: u32) -> u32 {
        (voxel >> 24) & 0xF
    }

    /// Insert a voxel stage into voxel value
    ///
    /// Panics if stage overflows max (15)
    #[inline]
    pub fn insert_stage(voxel: u32, stage: u32) -> u32 {
        assert!(stage <= 15, "Maximum stage is 15");

        (voxel & STAGE_MASK) | (stage << 24)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn id_insertion() {
        let mut voxel = 100230120;
        let id = 13;

        voxel = Blocks::insert_id(voxel, id);
        assert_eq!(Blocks::extract_id(voxel), id);

        // Exceeded maximum
        voxel = Blocks::insert_id(voxel, 65537);
        assert_eq!(Blocks::extract_id(voxel), 1);
    }

    #[test]
    fn rotation_insertion() {
        let mut voxel = 0;
        let id = 13;

        voxel = Blocks::insert_id(voxel, id);
        assert_eq!(Blocks::extract_rotation(voxel), BlockRotation::PY(0));

        voxel = Blocks::insert_rotation(voxel, &BlockRotation::NX(0));
        assert_eq!(Blocks::extract_rotation(voxel), BlockRotation::NX(0));

        voxel = Blocks::insert_rotation(voxel, &BlockRotation::PZ(90));
        assert_eq!(Blocks::extract_rotation(voxel), BlockRotation::PZ(90));

        assert_eq!(Blocks::extract_id(voxel), id);
    }

    #[test]
    fn rotation_correctness() {
        let rotation = BlockRotation::PX(0);

        let compare = |a: [f32; 3], b: [f32; 3]| {
            assert!((a[0] - b[0]).abs() < f32::EPSILON);
            assert!((a[1] - b[1]).abs() < f32::EPSILON);
            assert!((a[2] - b[2]).abs() < f32::EPSILON);
        };

        // default rotation at PY
        let mut point = [0.0, 1.0, 0.0];
        rotation.rotate(&mut point, false);
        compare(point, [1.0, 0.0, 0.0]);

        point = [0.0, 0.0, 1.0];
        rotation.rotate(&mut point, false);
        compare(point, [0.0, 0.0, 1.0]);
    }

    #[test]
    fn stage() {
        let mut voxel = 0;
        let id = 13;

        voxel = Blocks::insert_id(voxel, id);

        assert_eq!(Blocks::extract_stage(voxel), 0);

        for stage in 0..16 {
            voxel = Blocks::insert_stage(voxel, stage);
            assert_eq!(Blocks::extract_stage(voxel), stage);
        }

        assert_eq!(Blocks::extract_id(voxel), id);
    }

    // #[test]
    // #[should_panic(expected = "Maximum stage is 15")]
    // fn stage_max_exceeded() {
    //     let mut voxel = Blocks::insert_id(0, 13);
    //     voxel = Blocks::insert_stage(voxel, 16);
    // }
}
