use std::{collections::HashMap, fs::File};

use serde::{Deserialize, Serialize};
use server_common::{aabb::Aabb, quaternion::Quaternion, vec::Vec3};
use specs::{Builder, Entity as ECSEntity, World, WorldExt};

use crate::comp::{
    brain::{Brain, BrainOptions},
    curr_chunk::CurrChunk,
    etype::EType,
    rigidbody::RigidBody,
    rotation::Rotation,
    target::{Target, TargetInner},
    view_radius::ViewRadius,
    walk_towards::WalkTowards,
};

/// JSON format to store a rigid body configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RigidBodyProto {
    pub aabb: Vec3<f32>,
    pub head: f32,
    pub mass: f32,
    pub friction: f32,
    pub restitution: f32,
    pub gravity_multiplier: f32,
    pub auto_step: bool,
}

/// JSON format to store an entity model
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelProto {
    pub scale: i32,
    pub object: String,
}

/// Base entity type, compatible to store as JSON
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EntityPrototype {
    pub etype: String,
    pub observe: String,
    pub view_distance: i16,
    pub model: ModelProto,
    pub brain: String,
    pub brain_options: BrainOptions,
    pub rigidbody: RigidBodyProto,
}

/// Entity type map
pub type EntityPrototypes = HashMap<String, EntityPrototype>;

/// Entities resource stored as a map
pub struct Entities {
    prototypes: EntityPrototypes,
}

impl Default for Entities {
    fn default() -> Self {
        Self::new()
    }
}

impl Entities {
    pub fn new() -> Self {
        let entities_json: serde_json::Value =
            serde_json::from_reader(File::open("assets/metadata/entities.json").unwrap()).unwrap();

        let mut prototypes: EntityPrototypes = HashMap::new();

        for value in entities_json.as_object().unwrap().values() {
            let value_str = value.as_str().unwrap();
            let path = format!("./assets/metadata/entities/{}", value_str);
            let entity: EntityPrototype =
                serde_json::from_reader(File::open(path).unwrap()).unwrap();

            prototypes.insert(entity.etype.to_owned(), entity);
        }

        Self { prototypes }
    }

    /// Clone all prototypes
    pub fn get_all(&self) -> EntityPrototypes {
        self.prototypes.clone()
    }

    /// Get a single prototype reference
    pub fn get_prototype(&self, etype: &str) -> Option<&EntityPrototype> {
        self.prototypes.get(etype)
    }

    /// Spawn in an ECS entity, based on a certain prototype
    pub fn spawn_entity(
        ecs: &mut World,
        prototype: &EntityPrototype,
        etype: &str,
        position: &Vec3<f32>,
        rotation: &Quaternion,
    ) -> ECSEntity {
        let RigidBodyProto {
            aabb,
            head,
            mass,
            friction,
            restitution,
            gravity_multiplier,
            auto_step,
        } = &prototype.rigidbody;

        let observe = &prototype.observe;
        let view_distance = &prototype.view_distance;
        let brain_options = prototype.brain_options.to_owned();

        ecs.create_entity()
            .with(EType::new(etype))
            .with(RigidBody::new(
                Aabb::new(position, &aabb),
                *head,
                *mass,
                *friction,
                *restitution,
                *gravity_multiplier,
                *auto_step,
            ))
            .with(Rotation::from_quaternion(&rotation))
            .with(CurrChunk::new())
            .with(Target(if observe == "all" {
                TargetInner::ALL(None)
            } else if observe == "player" {
                TargetInner::PLAYER(None)
            } else {
                TargetInner::ENTITY(None)
            }))
            .with(ViewRadius::new(*view_distance))
            .with(Brain::new(brain_options))
            .with(WalkTowards(None, 100))
            .build()
    }
}
