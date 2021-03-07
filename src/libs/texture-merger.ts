import { CanvasTexture, ClampToEdgeWrapping, CompressedTexture, NearestFilter, Texture } from 'three';

class TextureMergerRectangle {
  public finalX: number;
  public finalY: number;

  constructor(public x: number, public y: number, public width: number, public height: number) {
    this.finalX = x + width;
    this.finalY = y + height;
  }

  set(x: number, y: number, x2: number, y2: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.finalX = x2;
    this.finalY = y2;
    this.width = width;
    this.height = height;

    return this;
  }

  fits(texture: Texture) {
    const tw = texture.image.width;
    const th = texture.image.height;
    return tw <= this.width && th <= this.height;
  }

  fitsPerfectly(texture: Texture) {
    const tw = texture.image.width;
    const th = texture.image.height;
    return tw === this.width && th === this.height;
  }

  overlaps(rect: TextureMergerRectangle) {
    return (
      this.x < rect.x + rect.width &&
      this.x + this.width > rect.x &&
      this.y < rect.y + rect.height &&
      this.y + this.height > rect.y
    );
  }
}

class TextureMerger {
  private MAX_TEXTURE_SIZE = 4096;

  public dataURLs: { [key: string]: any } = {};
  public textureCache: { [key: string]: any } = {};
  public node: { [key: string]: any } = {};
  public textureOffsets: { [key: string]: any } = {};
  public ranges: { [key: string]: any } = {};

  public allNodes: any[] = [];

  public canvas = document.createElement('canvas');
  public textureCount = 0;
  public maxWidth = 0;
  public maxHeight = 0;

  public context: CanvasRenderingContext2D | null;
  public mergedTexture: CanvasTexture;

  constructor(texturesObj: { [key: string]: Texture }) {
    if (!texturesObj) {
      return;
    }
    this.dataURLs = new Object();
    for (const textureName in texturesObj) {
      const txt = texturesObj[textureName];

      if (txt instanceof CompressedTexture) {
        throw new Error('CompressedTextures are not supported.');
      }

      if (typeof txt.image.toDataURL == 'undefined') {
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = txt.image.naturalWidth;
        tmpCanvas.height = txt.image.naturalHeight;
        console.log(tmpCanvas.getContext('2d'), txt.image);
        tmpCanvas.getContext('2d')?.drawImage(txt.image, 0, 0);
        this.dataURLs[textureName] = tmpCanvas.toDataURL();
      } else {
        this.dataURLs[textureName] = txt.image.toDataURL();
      }
    }

    let explanationStr = '';
    for (const textureName in texturesObj) {
      this.textureCount++;
      const texture = texturesObj[textureName];
      // @ts-ignore
      texture.area = texture.image.width * texture.image.height;
      if (texture.image.width > this.maxWidth) {
        this.maxWidth = texture.image.width;
      }
      if (texture.image.height > this.maxHeight) {
        this.maxHeight = texture.image.height;
      }
      explanationStr += `${textureName},`;
    }
    explanationStr = explanationStr.substring(0, explanationStr.length - 1);
    // node
    //  |___ children: Array(2) of node
    //  |___ rectangle: TextureMergerRectangle
    //  |___ textureName: String
    //  |___ upperNode: node
    this.node.rectangle = new TextureMergerRectangle(
      0,
      0,
      this.maxWidth * this.textureCount,
      this.maxHeight * this.textureCount,
    );

    // @ts-ignore
    this.insert(this.node, this.findNextTexture(texturesObj), texturesObj);

    const imgSize = this.calculateImageSize(texturesObj);
    this.canvas.width = imgSize.width;
    this.canvas.height = imgSize.height;
    const context = this.canvas.getContext('2d');
    this.context = context;
    for (const textureName in this.textureOffsets) {
      const texture = texturesObj[textureName];
      const offsetX = this.textureOffsets[textureName].x;
      const offsetY = this.textureOffsets[textureName].y;
      const imgWidth = texture.image.width;
      const imgHeight = texture.image.height;

      for (let y = offsetY; y < offsetY + imgHeight; y += imgHeight) {
        for (let x = offsetX; x < offsetX + imgWidth; x += imgWidth) {
          context?.drawImage(texture.image, x, y, imgWidth, imgHeight);
        }
      }

      const range: { [key: string]: any } = {};
      range.startU = offsetX / imgSize.width;
      range.endU = (offsetX + imgWidth) / imgSize.width;
      range.startV = 1 - offsetY / imgSize.height;
      range.endV = 1 - (offsetY + imgHeight) / imgSize.height;
      this.ranges[textureName] = range;
    }

    this.makeCanvasPowerOfTwo();
    this.mergedTexture = new CanvasTexture(this.canvas);
    this.mergedTexture.wrapS = ClampToEdgeWrapping;
    this.mergedTexture.wrapT = ClampToEdgeWrapping;
    this.mergedTexture.minFilter = NearestFilter;
    this.mergedTexture.magFilter = NearestFilter;
    this.mergedTexture.needsUpdate = true;
  }

  isTextureAlreadyInserted(textureName: string, texturesObj: { [key: string]: Texture }) {
    const texture = texturesObj[textureName];
    const img = this.dataURLs[textureName];
    for (const tName in texturesObj) {
      if (tName == textureName) {
        continue;
      }
      const txt = texturesObj[tName];
      const tImg = this.dataURLs[tName];
      if (
        img == tImg &&
        txt.offset.x == texture.offset.x &&
        txt.offset.y == texture.offset.y &&
        // @ts-ignore
        txt.offset.z == texture.offset.z &&
        txt.repeat.x == texture.repeat.x &&
        txt.repeat.y == texture.repeat.y &&
        // @ts-ignore
        txt.flipX == texture.flipX &&
        txt.flipY == texture.flipY &&
        txt.wrapS == texture.wrapS &&
        txt.wrapT == texture.wrapT
      ) {
        if (this.textureOffsets[tName]) {
          return this.textureOffsets[tName];
        }
      }
    }
    return false;
  }

  insert(node: any, textureName: string, texturesObj: { [key: string]: Texture }) {
    const texture = texturesObj[textureName];
    const res = this.isTextureAlreadyInserted(textureName, texturesObj);
    if (res) {
      this.textureOffsets[textureName] = res;
      const newTextureName = this.findNextTexture(texturesObj);
      if (!(newTextureName === null)) {
        this.insert(node, newTextureName, texturesObj);
      }
      return;
    }
    const tw = texture.image.width;
    const th = texture.image.height;
    if (node.upperNode) {
      let minArea = this.maxWidth * this.textureCount + this.maxHeight * this.textureCount;
      let minAreaNode;
      let inserted = false;
      for (let i = 0; i < this.allNodes.length; i++) {
        const curNode = this.allNodes[i];
        if (!curNode.textureName && curNode.rectangle.fits(texture)) {
          this.textureOffsets[textureName] = { x: curNode.rectangle.x, y: curNode.rectangle.y };
          const calculatedSize = this.calculateImageSize(texturesObj);
          const calculatedArea = calculatedSize.width + calculatedSize.height;
          if (
            calculatedArea < minArea &&
            calculatedSize.width <= this.MAX_TEXTURE_SIZE &&
            calculatedSize.height <= this.MAX_TEXTURE_SIZE
          ) {
            let overlaps = false;
            for (const tName in this.textureOffsets) {
              if (tName === textureName) {
                continue;
              }
              const cr = curNode.rectangle;
              const ox = this.textureOffsets[tName].x;
              const oy = this.textureOffsets[tName].y;
              const oimg = texturesObj[tName].image;
              const rect1 = new TextureMergerRectangle(cr.x, cr.y, tw, th);
              const rect2 = new TextureMergerRectangle(ox, oy, oimg.width, oimg.height);
              if (rect1.overlaps(rect2)) {
                overlaps = true;
              }
            }
            if (!overlaps) {
              minArea = calculatedArea;
              minAreaNode = this.allNodes[i];
              inserted = true;
            }
          }
          delete this.textureOffsets[textureName];
        }
      }
      if (inserted) {
        this.textureOffsets[textureName] = { x: minAreaNode.rectangle.x, y: minAreaNode.rectangle.y };
        minAreaNode.textureName = textureName;
        if (!minAreaNode.children) {
          const childNode1: { [key: string]: any } = {};
          const childNode2: { [key: string]: any } = {};
          childNode1.upperNode = minAreaNode;
          childNode2.upperNode = minAreaNode;
          minAreaNode.children = [childNode1, childNode2];
          const rx = minAreaNode.rectangle.x;
          const ry = minAreaNode.rectangle.y;
          const maxW = this.maxWidth * this.textureCount;
          const maxH = this.maxHeight * this.textureCount;
          childNode1.rectangle = new TextureMergerRectangle(rx + tw, ry, maxW - (rx + tw), maxH - ry);
          childNode2.rectangle = new TextureMergerRectangle(rx, ry + th, maxW - rx, maxH - (ry + th));
          this.allNodes.push(childNode1);
          this.allNodes.push(childNode2);
        }
        const newTextureName = this.findNextTexture(texturesObj);
        if (!(newTextureName == null)) {
          this.insert(node, newTextureName, texturesObj);
        }
      } else {
        throw new Error('Error: Try to use smaller textures.');
      }
    } else {
      // First node
      const recW = node.rectangle.width;
      const recH = node.rectangle.height;
      node.textureName = textureName;
      const childNode1: { [key: string]: any } = {};
      const childNode2: { [key: string]: any } = {};
      childNode1.upperNode = node;
      childNode2.upperNode = node;
      node.children = [childNode1, childNode2];
      childNode1.rectangle = new TextureMergerRectangle(tw, 0, recW - tw, th);
      childNode2.rectangle = new TextureMergerRectangle(0, th, recW, recH - th);
      this.textureOffsets[textureName] = { x: node.rectangle.x, y: node.rectangle.y };
      const newNode = node.children[0];
      this.allNodes = [node, childNode1, childNode2];
      const newTextureName = this.findNextTexture(texturesObj);
      if (!(newTextureName === null)) {
        this.insert(newNode, newTextureName, texturesObj);
      }
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

  calculateImageSize(texturesObj: { [key: string]: Texture }) {
    let width = 0;
    let height = 0;
    for (const textureName in this.textureOffsets) {
      const texture = texturesObj[textureName];
      const tw = texture.image.width;
      const th = texture.image.height;
      const x = this.textureOffsets[textureName].x;
      const y = this.textureOffsets[textureName].y;
      if (x + tw > width) {
        width = x + tw;
      }
      if (y + th > height) {
        height = y + th;
      }
    }
    return { width: width, height: height };
  }

  findNextTexture(texturesObj: { [key: string]: Texture }) {
    let maxArea = -1;
    let foundTexture = '';
    for (const textureName in texturesObj) {
      const texture = texturesObj[textureName];
      if (!this.textureCache[textureName]) {
        // @ts-ignore
        if (texture.area > maxArea) {
          // @ts-ignore
          maxArea = texture.area;
          foundTexture = textureName;
        }
      }
    }
    if (maxArea == -1) {
      return null;
    }
    if (foundTexture) this.textureCache[foundTexture] = true;
    return foundTexture;
  }

  rescale(canvas: HTMLCanvasElement, scale: number) {
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = canvas.width * scale;
    resizedCanvas.height = canvas.height * scale;
    const resizedContext = resizedCanvas.getContext('2d');
    resizedContext?.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      resizedCanvas.width,
      resizedCanvas.height,
    );
    //this.debugCanvas(resizedCanvas);
    return resizedCanvas;
  }
}

export { TextureMerger };
