// Engine options object, and engine instantiation:
const { Engine } = MineJS;

const engine = new Engine({
  generator: 'sin-cos',
});

engine.start();
