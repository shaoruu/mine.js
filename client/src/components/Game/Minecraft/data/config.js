// TODO: Export this to a player's Options
// This object contains the state of the app
export default {
	isDev: false,
	isShowingStats: true,
	isLoaded: false,
	isTweening: false,
	isRotating: true,
	isMouseMoving: false,
	isMouseOver: false,
	maxAnisotropy: 1,
	dpr: 1,
	duration: 500,
	model: {
		path: './assets/models/Teapot.json',
		scale: 20
	},
	texture: {
		path: './assets/textures/',
		imageFiles: [{ name: 'UV', image: 'UV_Grid_Sm.jpg' }]
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
		color: 0xffffff,
		near: 0.0008
	},
	camera: {
		fov: 75,
		near: 1,
		far: 1000,
		aspect: 1,
		posX: 0,
		posY: 0,
		posZ: 0
	},
	player: {
		inertia: 10.0,
		speed: {
			horizontal: 120,
			vertical: 160
		},
		coordinateDec: 2,
		posX: 0,
		posY: 5,
		posZ: 10
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
		enabled: true,
		color: 0x141414
	},
	directionalLight: {
		enabled: true,
		color: 0xf0f0f0,
		intensity: 0.4,
		x: -75,
		y: 280,
		z: 150
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
		dimension: 20
	},
	chunk: {
		size: 8
	},
	world: {
		minHorizontalSize: 10, // minimum chunk dimension for world,
		minVerticalSize: 10
	}
}
