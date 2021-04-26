import { createCanvas, Image } from 'canvas';

const WIDTH = 16;

export const makeColorTexture = (color: string) => {
  const canvas = createCanvas(WIDTH, WIDTH);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, WIDTH, WIDTH);

  const image = new Image();
  image.src = canvas.toBuffer();

  return image;
};
