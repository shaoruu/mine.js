/**
 * THIS IS WHERE ALL THE CONSTANTS LIVE
 */

const Config = {
  lights: {
    ambientLight: {
      enabled: true,
      color: 0xffffff,
      intensity: 1
    }
  },
  scene: {
    background: {
      color: 0xdbe8ff
    },
    fog: {
      color: 0xdcebf4,
      near: 0.0008,
      far: 2500
    }
  },
  camera: {
    fov: 102,
    near: 1,
    far: 2500,
    aspect: 1,
    posX: 0,
    posY: 0,
    posZ: 0,
    sprintFovDelta: 15,
    spectatorFov: 130
  },
  keyboard: {
    movements: {
      forward: 87,
      backward: 83,
      left: 65,
      right: 68,
      sneak: 16,
      jump: 32
    },
    inventory: {
      h1: 49,
      h2: 50,
      h3: 51,
      h4: 52,
      h5: 53,
      h6: 54,
      h7: 55,
      h8: 56,
      h9: 57
    },
    multiplayer: {
      openChat: 84,
      openCommand: 191
    },
    dblTimeout: 200 // ms
  },
  player: {
    height: 50, // px
    inertia: 10,
    fricIntertia: 15.0,
    inAirInertia: 16, // For jumping
    sprintFactor: 1.3,
    spectatorInertia: 6,
    acceleration: {
      forward: 15,
      other_horz: 8,
      vertical: 12,
      jump: 80
    },
    maxSpeed: {
      horizontal: 700,
      vertical: 800
    },
    aabb: {
      // Based on block dimension
      width: 0.5,
      eye2toe: 1.6,
      eye2top: 0.2,
      depth: 0.5
    },
    coordinateDec: 2,
    position: {
      posX: 0.48,
      posY: 4.49,
      posZ: 5.53
    },
    render: {
      horzD: 2,
      vertD: 1
    },
    reachDst: 7
  },
  block: {
    dimension: 12,
    transparent: [0, 18],
    overridable: [0],
    liquid: [0]
  },
  chunk: {
    size: 32,
    height: 256
  },
  world: {
    gravity: -4.95
  }
}

export default Config
