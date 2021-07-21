use std::{collections::HashMap, fs::File};

use serde::{Deserialize, Serialize};
use server_common::{aabb::Aabb, quaternion::Quaternion, vec::Vec3};
use specs::{Builder, Entity as ECSEntity, World, WorldExt};

use crate::comp::{
    curr_chunk::CurrChunk,
    etype::EType,
    lookat::{LookAt, LookTarget},
    rigidbody::RigidBody,
    rotation::Rotation,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RigidBodyProto {
    pub aabb: [f32; 3],
    pub mass: f32,
    pub friction: f32,
    pub restitution: f32,
    pub gravity_multiplier: f32,
    pub auto_step: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelProto {
    pub scale: i32,
    pub object: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EntityPrototype {
    pub etype: String,
    pub brain: String,
    pub observe: String,
    pub model: ModelProto,
    pub rigidbody: RigidBodyProto,
}

pub type EntityPrototypes = HashMap<String, EntityPrototype>;

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
            serde_json::from_reader(File::open("metadata/entities.json").unwrap()).unwrap();

        let mut prototypes: EntityPrototypes = HashMap::new();

        for value in entities_json.as_object().unwrap().values() {
            let value_str = value.as_str().unwrap();
            let path = format!("./metadata/entities/{}", value_str);
            let entity: EntityPrototype =
                serde_json::from_reader(File::open(path).unwrap()).unwrap();

            prototypes.insert(entity.etype.to_owned(), entity);
        }

        Self { prototypes }
    }

    pub fn get_all(&self) -> EntityPrototypes {
        self.prototypes.clone()
    }

    pub fn get_prototype(&self, etype: &str) -> Option<&EntityPrototype> {
        self.prototypes.get(etype)
    }

    pub fn spawn_entity(
        prototype: &EntityPrototype,
        ecs: &mut World,
        etype: &str,
        position: &Vec3<f32>,
        rotation: &Quaternion,
    ) -> ECSEntity {
        let RigidBodyProto {
            aabb,
            mass,
            friction,
            restitution,
            gravity_multiplier,
            auto_step,
        } = prototype.rigidbody;

        let observe = &prototype.observe;

        ecs.create_entity()
            .with(EType::new(etype))
            .with(RigidBody::new(
                Aabb::new(position, &Vec3::from_arr(aabb)),
                mass,
                friction,
                restitution,
                gravity_multiplier,
                auto_step,
            ))
            .with(Rotation::from_quaternion(&rotation))
            .with(CurrChunk::new())
            .with(LookAt(if observe == "all" {
                LookTarget::ALL(None)
            } else if observe == "player" {
                LookTarget::PLAYER(None)
            } else {
                LookTarget::ENTITY(None)
            }))
            .build()
    }
}
