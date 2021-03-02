import ndarray from 'ndarray';
import { Engine } from '..';
import { Coords3 } from './types';

abstract class Generator {
  constructor(public engine: Engine) {}

  abstract generate(data: ndarray, min: Coords3, max: Coords3): void;
}

class DefaultGenerator extends Generator {
  constructor(engine: Engine) {
    super(engine);
  }

  generate(data: ndarray, min: Coords3, max: Coords3) {}
}

class FlatGenerator extends Generator {
  constructor(engine: Engine) {
    super(engine);
  }

  generate(data: ndarray, min: Coords3, max: Coords3) {}
}

class SinCosGenerator extends Generator {
  constructor(engine: Engine) {
    super(engine);
  }

  generate(data: ndarray, min: Coords3, max: Coords3) {}
}

export { Generator, DefaultGenerator, FlatGenerator, SinCosGenerator };
