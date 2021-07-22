use server_common::vec::Vec3;
use specs::{Component, VecStorage};

type LookTargetValue = Option<Vec3<f32>>;

/// Observable target of an entity
#[derive(Clone, Debug)]
pub enum LookTarget {
    ALL(LookTargetValue),
    PLAYER(LookTargetValue),
    ENTITY(LookTargetValue),
}

impl LookTarget {
    pub fn extract(target: Self) -> LookTargetValue {
        match target {
            LookTarget::ALL(val) => val,
            LookTarget::ENTITY(val) => val,
            LookTarget::PLAYER(val) => val,
        }
    }

    pub fn insert(target: &Self, val: LookTargetValue) -> Self {
        match target {
            LookTarget::ALL(_) => LookTarget::ALL(val),
            LookTarget::ENTITY(_) => LookTarget::ENTITY(val),
            LookTarget::PLAYER(_) => LookTarget::PLAYER(val),
        }
    }
}

/// By adding this component, an entity has the ability to scan around
/// and look at the closest entity.
#[derive(Component, Debug)]
#[storage(VecStorage)]
pub struct LookAt(pub LookTarget);

impl LookAt {
    pub fn new(target: &LookTarget) -> Self {
        Self(target.to_owned())
    }
}
