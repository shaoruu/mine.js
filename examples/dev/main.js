// Engine options object, and engine instantiation:
const { Engine } = MineJS;

const imageElement = document.createElement('img');
imageElement.src = 'resources/grass_top.png';
imageElement.onload = () => {
  const engine = new Engine({
    generator: 'sin-cos',
  });

  engine.registry.addMaterial('grass', { image: imageElement });
  engine.registry.addBlock('grass', 'grass');

  engine.start();
};
