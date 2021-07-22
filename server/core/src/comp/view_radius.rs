use specs::{Component, VecStorage};

/// A view radius defines how far an entity can see.
///
/// The unit is voxels.
#[derive(Default, Component)]
#[storage(VecStorage)]
pub struct ViewRadius(pub i16);

impl ViewRadius {
    pub fn new(r: i16) -> Self {
        Self(r)
    }
}
