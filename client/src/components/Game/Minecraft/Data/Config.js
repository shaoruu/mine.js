// TODO: Export this to a player's Options
// This object contains the state of the app
export default {
  isDev: false,
  isShowingStats: true,
  isLoaded: false,
  isRotating: true,
  isMouseMoving: false,
  isMouseOver: false,
  maxAnisotropy: 1,
  dpr: 1,
  duration: 500,
  dictionary: {
    block: {
      0: {
        id: 0,
        name: 'air'
      },
      1: {
        id: 1,
        name: 'stone'
      },
      2: {
        id: 2,
        name: 'grass'
      },
      3: {
        id: 3,
        name: 'dirt'
      }
    }
  },
  mesh: {
    enableHelper: false,
    wireframe: false,
    translucent: false,
    material: {
      color: 0xffffff,
      emissive: 0xffffff
    }
  },
  fog: {
    color: 0xdcebf4,
    near: 0.0008,
    far: 2500
  },
  camera: {
    fov: 75,
    near: 1,
    far: 2500,
    aspect: 1,
    posX: 0,
    posY: 0,
    posZ: 0
  },
  player: {
    height: 50, // px
    inertia: 5.0,
    acceleration: {
      horizontal: 25,
      vertical: 22
    },
    maxSpeed: {
      horizontal: 700,
      vertical: 800
    },
    aabb: {
      // Based on block dimension
      width: 0.6,
      height: 1.8,
      depth: 0.6
    },
    coordinateDec: 2,
    posX: 0,
    posY: 30,
    posZ: 0,
    horzD: 5,
    vertD: 3,
    reachDst: 7
  },
  controls: {
    autoRotate: true,
    autoRotateSpeed: -0.5,
    rotateSpeed: 0.5,
    zoomSpeed: 0.8,
    minDistance: 200,
    maxDistance: 600,
    minPolarAngle: Math.PI / 5,
    maxPolarAngle: Math.PI / 2,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
    enableDamping: true,
    dampingFactor: 0.5,
    enableZoom: true,
    target: {
      x: 0,
      y: 0,
      z: 0
    }
  },
  ambientLight: {
    enabled: false,
    color: 0xf0f0f0
  },
  directionalLight: {
    enabled: true,
    color: 0xf0f0f0,
    intensity: 1,
    x: 0,
    y: 1,
    z: 0
  },
  shadow: {
    enabled: true,
    helperEnabled: true,
    bias: 0,
    mapWidth: 2048,
    mapHeight: 2048,
    near: 250,
    far: 400,
    top: 100,
    right: 100,
    bottom: -100,
    left: -100
  },
  pointLight: {
    enabled: true,
    color: 0xffffff,
    intensity: 0.8,
    distance: 0, // default
    x: -100,
    y: 300,
    z: -100
  },
  hemiLight: {
    enabled: true,
    color: 0xeeeeff,
    groundColor: 0x777788,
    intensity: 0.75,
    x: 0.5,
    y: 1,
    z: 0.75
  },
  block: {
    dimension: 30
  },
  chunk: {
    size: 8,
    height: 50
  },
  world: {
    noiseConstant: 50,
    maxWorkerCount: 4
  }
}
