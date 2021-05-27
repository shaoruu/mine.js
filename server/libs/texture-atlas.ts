import { createCanvas, Canvas, Image } from 'canvas';

type TextureAtlasOptionsType = {
  textureDimension: number;
};

const defaultTextureAtlasOptions = {
  textureDimension: 16,
};

class TextureAtlas {
  public options: TextureAtlasOptionsType;

  public ranges: { [key: string]: { startV: number; endV: number; startU: number; endU: number } } = {};
  public canvas: Canvas;

  constructor(textureMap: { [key: string]: Image }, options: Partial<TextureAtlasOptionsType> = {}) {
    const { textureDimension } = (this.options = {
      ...defaultTextureAtlasOptions,
      ...options,
    });

    const countPerSide = 2 * Math.round(Math.ceil(Math.sqrt(Object.keys(textureMap).length)) / 2);
    const canvasWidth = countPerSide * textureDimension;
    const canvasHeight = countPerSide * textureDimension;

    this.canvas = createCanvas(canvasWidth, canvasHeight);
    this.makeCanvasPowerOfTwo(this.canvas);

    let row = 0;
    let col = 0;
    for (const textureName in textureMap) {
      if (col >= countPerSide) {
        col = 0;
        row++;
      }

      const texture = textureMap[textureName];

      const context = this.canvas.getContext('2d');
      if (context) {
        const startX = col * textureDimension;
        const startY = row * textureDimension;

        // ? idk if this works
        context.drawImage(texture, startX, startY, textureDimension, textureDimension);

        const startU = startX / this.canvas.width;
        const endU = (startX + textureDimension) / this.canvas.width;
        const startV = 1 - startY / this.canvas.height;
        const endV = 1 - (startY + textureDimension) / this.canvas.height;

        this.ranges[textureName] = {
          startU,
          endU,
          startV,
          endV,
        };
      }

      col++;
    }
  }

  makeCanvasPowerOfTwo(canvas: Canvas) {
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    const newWidth = Math.pow(2, Math.round(Math.log(oldWidth) / Math.log(2)));
    const newHeight = Math.pow(2, Math.round(Math.log(oldHeight) / Math.log(2)));
    const newCanvas = createCanvas(newWidth, newHeight);
    newCanvas.getContext('2d')?.drawImage(canvas, 0, 0, newWidth, newHeight);
    this.canvas = newCanvas;
  }

  get dataURL() {
    return this.canvas.toDataURL();
  }
}

export { TextureAtlas };
