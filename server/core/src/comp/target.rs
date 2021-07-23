use server_common::vec::Vec3;
use specs::{Component, Entity, VecStorage};

type TargetValue = Option<(Vec3<f32>, Entity)>;

/// Observable target of an entity
#[derive(Clone, Debug)]
pub enum TargetInner {
    ALL(TargetValue),
    PLAYER(TargetValue),
    ENTITY(TargetValue),
}

impl TargetInner {
    fn extract(target: &Self) -> TargetValue {
        match target {
            TargetInner::ALL(val) => val,
            TargetInner::ENTITY(val) => val,
            TargetInner::PLAYER(val) => val,
        }
        .to_owned()
    }

    fn insert(target: &Self, val: TargetValue) -> Self {
        match target {
            TargetInner::ALL(_) => TargetInner::ALL(val),
            TargetInner::ENTITY(_) => TargetInner::ENTITY(val),
            TargetInner::PLAYER(_) => TargetInner::PLAYER(val),
        }
    }
}

/// By adding this component, an entity has the ability to scan around
/// and look at the closest entity.
#[derive(Component, Debug)]
#[storage(VecStorage)]
pub struct Target(pub TargetInner);

impl Target {
    pub fn new(target: &TargetInner) -> Self {
        Self(target.to_owned())
    }

    pub fn set(&mut self, value: TargetValue) {
        self.0 = TargetInner::insert(&self.0, value);
    }

    pub fn position(&self) -> Option<Vec3<f32>> {
        if let Some(inner) = TargetInner::extract(&self.0) {
            Some(inner.0)
        } else {
            None
        }
    }

    pub fn entity(&self) -> Option<Entity> {
        if let Some(inner) = TargetInner::extract(&self.0) {
            Some(inner.1)
        } else {
            None
        }
    }
}
