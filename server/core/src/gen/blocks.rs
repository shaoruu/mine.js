/// Base class to extract voxel data from a single u32
///
/// Bit lineup as such (from right to left):
/// - `1 - 16 bits`: ID (0x0000FFFF)
/// - `17 - 20 bit`: rotation (0x000F0000)
/// - `25 - 32 bit`: stage (0x0FF00000)

const PY_ROTATION: u32 = 0;
const NY_ROTATION: u32 = 1;
const PX_ROTATION: u32 = 2;
const NX_ROTATION: u32 = 3;
const PZ_ROTATION: u32 = 4;
const NZ_ROTATION: u32 = 5;

const ROTATION_MASK: u32 = 0xFFF0FFFF;
const STAGE_MASK: u32 = 0xF00FFFFF;

/// 6 possible rotations: (px, nx, py, ny, pz, nz)
///
/// Default rotation is PY
#[derive(PartialEq, Eq, Debug)]
pub enum BlockRotation {
    PX,
    NX,
    PY,
    NY,
    PZ,
    NZ,
}

impl BlockRotation {
    pub fn encode(value: u32) -> Self {
        match value {
            PX_ROTATION => BlockRotation::PX,
            NX_ROTATION => BlockRotation::NX,
            PY_ROTATION => BlockRotation::PY,
            NY_ROTATION => BlockRotation::NY,
            PZ_ROTATION => BlockRotation::PZ,
            NZ_ROTATION => BlockRotation::NZ,
            _ => panic!("Unknown rotation: {}", value),
        }
    }

    pub fn decode(rotation: &Self) -> u32 {
        match rotation {
            BlockRotation::PX => PX_ROTATION,
            BlockRotation::NX => NX_ROTATION,
            BlockRotation::PY => PY_ROTATION,
            BlockRotation::NY => NY_ROTATION,
            BlockRotation::PZ => PZ_ROTATION,
            BlockRotation::NZ => NZ_ROTATION,
        }
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
        BlockRotation::encode(rotation)
    }

    /// Insert a voxel rotation into voxel value
    #[inline]
    pub fn insert_rotation(voxel: u32, rotation: &BlockRotation) -> u32 {
        let rotation = BlockRotation::decode(rotation);
        (voxel & ROTATION_MASK) | ((rotation & 0xF) << 16)
    }

    /// Extract the bits in voxel that stores the stage value
    #[inline]
    pub fn extract_stage(voxel: u32) -> u32 {
        (voxel >> 20) & 0xF
    }

    /// Insert a voxel stage into voxel value
    ///
    /// Panics if stage overflows max (15)
    #[inline]
    pub fn insert_stage(voxel: u32, stage: u32) -> u32 {
        assert!(stage <= 15, "Maximum stage is 15");

        (voxel & STAGE_MASK) | (stage << 20)
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
        assert_eq!(Blocks::extract_rotation(voxel), BlockRotation::PY);

        voxel = Blocks::insert_rotation(voxel, &BlockRotation::NX);
        assert_eq!(Blocks::extract_rotation(voxel), BlockRotation::NX);

        voxel = Blocks::insert_rotation(voxel, &BlockRotation::PZ);
        assert_eq!(Blocks::extract_rotation(voxel), BlockRotation::PZ);

        assert_eq!(Blocks::extract_id(voxel), id);
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
