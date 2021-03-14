import { Texture, CompressedTexture, CanvasTexture, ClampToEdgeWrapping, NearestFilter } from 'three';

type TextureAtlasOptionsType = {
  textureDimension: number;
};

const defaultTextureAtlasOptions = {
  textureDimension: 16,
};

class TextureAtlas {
  public options: TextureAtlasOptionsType;
  public mergedTexture: CanvasTexture;

  public ranges: { [key: string]: { startV: number; endV: number; startU: number; endU: number } } = {};
  public dataURLs: { [key: string]: string } = {};
  public canvas = document.createElement('canvas');

  constructor(textureMap: { [key: string]: Texture }, options: Partial<TextureAtlasOptionsType> = {}) {
    const { textureDimension } = (this.options = {
      ...defaultTextureAtlasOptions,
      ...options,
    });

    const countPerSide = Math.ceil(Math.sqrt(Object.keys(textureMap).length));
    const canvasWidth = countPerSide * textureDimension;
    const canvasHeight = countPerSide * textureDimension;
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    let row = 0;
    let col = 0;
    for (const textureName in textureMap) {
      if (col >= countPerSide) {
        col = 0;
        row++;
      }

      const texture = textureMap[textureName];

      if (texture instanceof CompressedTexture) {
        throw new Error('CompressedTextures are not supported.');
      }

      // saving the textures
      if (typeof texture.image.toDataURL === 'undefined') {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = texture.image.naturalWidth;
        tempCanvas.height = texture.image.naturalHeight;
        tempCanvas.getContext('2d')?.drawImage(texture.image, 0, 0);
        this.dataURLs[textureName] = tempCanvas.toDataURL();
      } else {
        this.dataURLs[textureName] = texture.image.toDataURL();
      }

      const context = this.canvas.getContext('2d');
      if (context) {
        const startX = col * textureDimension;
        const startY = row * textureDimension;

        context.drawImage(texture.image, startX, startY, textureDimension, textureDimension);

        const startU = startX / canvasWidth;
        const endU = (startX + textureDimension) / canvasWidth;
        const startV = 1 - startY / canvasHeight;
        const endV = 1 - (startY + textureDimension) / canvasHeight;

        this.ranges[textureName] = {
          startU,
          endU,
          startV,
          endV,
        };

        this.makeCanvasPowerOfTwo(this.canvas);
        this.mergedTexture = new CanvasTexture(this.canvas);
        this.mergedTexture.wrapS = ClampToEdgeWrapping;
        this.mergedTexture.wrapT = ClampToEdgeWrapping;
        this.mergedTexture.minFilter = NearestFilter;
        this.mergedTexture.magFilter = NearestFilter;
        this.mergedTexture.needsUpdate = true;
      }

      col++;
    }
  }

  makeCanvasPowerOfTwo(canvas?: HTMLCanvasElement | undefined) {
    let setCanvas = false;
    if (!canvas) {
      canvas = this.canvas;
      setCanvas = true;
    }
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    const newWidth = Math.pow(2, Math.round(Math.log(oldWidth) / Math.log(2)));
    const newHeight = Math.pow(2, Math.round(Math.log(oldHeight) / Math.log(2)));
    const newCanvas = document.createElement('canvas');
    newCanvas.width = newWidth;
    newCanvas.height = newHeight;
    newCanvas.getContext('2d')?.drawImage(canvas, 0, 0, newWidth, newHeight);
    if (setCanvas) {
      this.canvas = newCanvas;
    }
  }
}

export { TextureAtlas };
