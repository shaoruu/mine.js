import Helpers from '../../../utils/helpers'
import Config from '../../../config/config'

const SIZE = Config.chunk.size
const NEIGHBOR_WIDTH = Config.chunk.neighborWidth

class LightingManager {
  constructor(generator) {
    this.generator = generator
  }

  getBlockLighting = (x, y, z, voxelData, offsets) => {
    const surroundings = [
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: -1 },
      { x: 0, y: -1, z: 0 }
    ]

    const lights = new Uint8Array(surroundings.length)

    for (let i = 0; i < surroundings.length; i++) {
      const block = {
        x: x + surroundings[i].x,
        y: y + surroundings[i].y,
        z: z + surroundings[i].z,
        lightLevel: 15
      }
      const value = Helpers.getLoadedBlocks(
        block.x,
        block.y,
        block.z,
        voxelData,
        this.generator,
        offsets
      )
      if (Helpers.isTransparent(value)) {
        const pastNodeCoords = new Set([Helpers.get3DCoordsRep(block.x, -1, block.z)])
        const queue = [block]

        while (queue.length > 0) {
          const q = queue.shift()
          if (this.generator.getHighestBlock(q.x, q.z) < q.y) {
            lights[i] = q.lightLevel
            break
          }
          for (let n = 1; n < surroundings.length - 1; n++) {
            const newNode = {
              x: q.x + surroundings[n].x,
              y: -1,
              z: q.z + surroundings[n].z,
              lightLevel: q.lightLevel - 1
            }
            if (
              pastNodeCoords.has(Helpers.get3DCoordsRep(newNode.x, newNode.y, newNode.z)) ||
              newNode.lightLevel < 0
            )
              continue

            let yValue = q.y

            let startValue = 0

            let endValue = Helpers.getLoadedBlocks(
              newNode.x,
              yValue,
              newNode.z,
              voxelData,
              this.generator,
              offsets
            )

            while (Helpers.isTransparent(startValue) && !Helpers.isTransparent(endValue)) {
              yValue += 1
              startValue = Helpers.getLoadedBlocks(
                q.x,
                yValue,
                q.z,
                voxelData,
                this.generator,
                offsets
              )
              endValue = Helpers.getLoadedBlocks(
                newNode.x,
                yValue,
                newNode.z,
                voxelData,
                this.generator,
                offsets
              )
            }

            if (!Helpers.isTransparent(startValue) || !Helpers.isTransparent(endValue)) continue

            newNode.y = yValue

            queue.push(newNode)
            pastNodeCoords.add(Helpers.get3DCoordsRep(newNode.x, -1, newNode.z))
          }
        }
      }
    }

    return lights
  }

  getBlockSmoothLighting = (x, y, z, voxelData) => {
    const output = new Array(6)

    const light = 2
    const shadow = 1

    const nxnzny = voxelData.get(x - 1, z - 1, y - 1)
    const nzny = voxelData.get(x, z - 1, y - 1)
    const pxnzny = voxelData.get(x + 1, z - 1, y - 1)
    const nxny = voxelData.get(x - 1, z, y - 1)
    const ny = voxelData.get(x, z, y - 1)
    const pxny = voxelData.get(x + 1, z, y - 1)
    const nxpzny = voxelData.get(x - 1, z + 1, y - 1)
    const pzny = voxelData.get(x, z + 1, y - 1)
    const pxpzny = voxelData.get(x + 1, z + 1, y - 1)

    const nxnz = voxelData.get(x - 1, z - 1, y)
    const nz = voxelData.get(x, z - 1, y)
    const pxnz = voxelData.get(x + 1, z - 1, y)
    const nx = voxelData.get(x - 1, z, y)
    const px = voxelData.get(x + 1, z, y)
    const nxpz = voxelData.get(x - 1, z + 1, y)
    const pz = voxelData.get(x, z + 1, y)
    const pxpz = voxelData.get(x + 1, z + 1, y)

    const nxnzpy = voxelData.get(x - 1, z - 1, y + 1)
    const nzpy = voxelData.get(x, z - 1, y + 1)
    const pxnzpy = voxelData.get(x + 1, z - 1, y + 1)
    const nxpy = voxelData.get(x - 1, z, y + 1)
    const py = voxelData.get(x, z, y + 1)
    const pxpy = voxelData.get(x + 1, z, y + 1)
    const nxpzpy = voxelData.get(x - 1, z + 1, y + 1)
    const pzpy = voxelData.get(x, z + 1, y + 1)
    const pxpzpy = voxelData.get(x + 1, z + 1, y + 1)

    if (Helpers.isTransparent(py)) {
      const a =
        !Helpers.isTransparent(nxpy) ||
        !Helpers.isTransparent(nzpy) ||
        !Helpers.isTransparent(nxnzpy)
          ? 0
          : 1
      const b =
        !Helpers.isTransparent(nxpy) ||
        !Helpers.isTransparent(pzpy) ||
        !Helpers.isTransparent(nxpzpy)
          ? 0
          : 1
      const c =
        !Helpers.isTransparent(pxpy) ||
        !Helpers.isTransparent(pzpy) ||
        !Helpers.isTransparent(pxpzpy)
          ? 0
          : 1
      const d =
        !Helpers.isTransparent(pxpy) ||
        !Helpers.isTransparent(nzpy) ||
        !Helpers.isTransparent(pxnzpy)
          ? 0
          : 1

      const e = !Helpers.isTransparent(nxnzpy) ? 0 : 1
      const f = !Helpers.isTransparent(nxpzpy) ? 0 : 1
      const g = !Helpers.isTransparent(pxpzpy) ? 0 : 1
      const h = !Helpers.isTransparent(pxnzpy) ? 0 : 1

      if (e + g > f + h) {
        const py2ColorsFace0 = new Uint8Array(3)
        py2ColorsFace0[0] = b === 0 ? shadow : light
        py2ColorsFace0[1] = c === 0 ? shadow : light
        py2ColorsFace0[2] = a === 0 ? shadow : light

        const py2ColorsFace1 = new Uint8Array(3)
        py2ColorsFace1[0] = c === 0 ? shadow : light
        py2ColorsFace1[1] = d === 0 ? shadow : light
        py2ColorsFace1[2] = a === 0 ? shadow : light

        output[0] = [py2ColorsFace0, py2ColorsFace1, [1, 1, 1]]
      } else {
        const pyColorsFace0 = new Uint8Array(3)
        pyColorsFace0[0] = a === 0 ? shadow : light
        pyColorsFace0[1] = b === 0 ? shadow : light
        pyColorsFace0[2] = d === 0 ? shadow : light

        const pyColorsFace1 = new Uint8Array(3)
        pyColorsFace1[0] = b === 0 ? shadow : light
        pyColorsFace1[1] = c === 0 ? shadow : light
        pyColorsFace1[2] = d === 0 ? shadow : light

        output[0] = [pyColorsFace0, pyColorsFace1, [0, 0, 0]]
      }
    }

    if (Helpers.isTransparent(px)) {
      const a =
        !Helpers.isTransparent(pxny) ||
        !Helpers.isTransparent(pxnz) ||
        !Helpers.isTransparent(pxnzny)
          ? 0
          : 1
      const b =
        !Helpers.isTransparent(pxny) ||
        !Helpers.isTransparent(pxpz) ||
        !Helpers.isTransparent(pxpzny)
          ? 0
          : 1
      const c =
        !Helpers.isTransparent(pxpy) ||
        !Helpers.isTransparent(pxpz) ||
        !Helpers.isTransparent(pxpzpy)
          ? 0
          : 1
      const d =
        !Helpers.isTransparent(pxpy) ||
        !Helpers.isTransparent(pxnz) ||
        !Helpers.isTransparent(pxnzpy)
          ? 0
          : 1

      const e = !Helpers.isTransparent(pxnzny) ? 0 : 1
      const f = !Helpers.isTransparent(pxpzny) ? 0 : 1
      const g = !Helpers.isTransparent(pxpzpy) ? 0 : 1
      const h = !Helpers.isTransparent(pxnzpy) ? 0 : 1

      if (e + g > f + h) {
        const px2ColorsFace0 = new Uint8Array(3)
        px2ColorsFace0[0] = b === 0 ? shadow : light
        px2ColorsFace0[1] = a === 0 ? shadow : light
        px2ColorsFace0[2] = c === 0 ? shadow : light

        const px2ColorsFace1 = new Uint8Array(3)
        px2ColorsFace1[0] = a === 0 ? shadow : light
        px2ColorsFace1[1] = d === 0 ? shadow : light
        px2ColorsFace1[2] = c === 0 ? shadow : light

        output[1] = [px2ColorsFace0, px2ColorsFace1, [1, 1, 1]]
      } else {
        const pxColorsFace0 = new Uint8Array(3)
        pxColorsFace0[0] = c === 0 ? shadow : light
        pxColorsFace0[1] = b === 0 ? shadow : light
        pxColorsFace0[2] = d === 0 ? shadow : light

        const pxColorsFace1 = new Uint8Array(3)
        pxColorsFace1[0] = b === 0 ? shadow : light
        pxColorsFace1[1] = a === 0 ? shadow : light
        pxColorsFace1[2] = d === 0 ? shadow : light

        output[1] = [pxColorsFace0, pxColorsFace1, [0, 0, 0]]
      }
    }

    if (Helpers.isTransparent(pz)) {
      const a =
        !Helpers.isTransparent(pzny) ||
        !Helpers.isTransparent(nxpz) ||
        !Helpers.isTransparent(nxpzny)
          ? 0
          : 1
      const b =
        !Helpers.isTransparent(pzny) ||
        !Helpers.isTransparent(pxpz) ||
        !Helpers.isTransparent(pxpzny)
          ? 0
          : 1
      const c =
        !Helpers.isTransparent(pzpy) ||
        !Helpers.isTransparent(pxpz) ||
        !Helpers.isTransparent(pxpzpy)
          ? 0
          : 1
      const d =
        !Helpers.isTransparent(pzpy) ||
        !Helpers.isTransparent(nxpz) ||
        !Helpers.isTransparent(nxpzpy)
          ? 0
          : 1

      const e = !Helpers.isTransparent(nxpzny) ? 0 : 1
      const f = !Helpers.isTransparent(pxpzny) ? 0 : 1
      const g = !Helpers.isTransparent(pxpzpy) ? 0 : 1
      const h = !Helpers.isTransparent(nxpzpy) ? 0 : 1

      if (e + g < f + h) {
        const pz2ColorsFace0 = new Uint8Array(3)
        pz2ColorsFace0[0] = a === 0 ? shadow : light
        pz2ColorsFace0[1] = b === 0 ? shadow : light
        pz2ColorsFace0[2] = d === 0 ? shadow : light

        const pz2ColorsFace1 = new Uint8Array(3)
        pz2ColorsFace1[0] = b === 0 ? shadow : light
        pz2ColorsFace1[1] = c === 0 ? shadow : light
        pz2ColorsFace1[2] = d === 0 ? shadow : light

        output[2] = [pz2ColorsFace0, pz2ColorsFace1, [1, 1, 1]]
      } else {
        const pzColorsFace0 = new Uint8Array(3)
        pzColorsFace0[0] = d === 0 ? shadow : light
        pzColorsFace0[1] = a === 0 ? shadow : light
        pzColorsFace0[2] = c === 0 ? shadow : light

        const pzColorsFace1 = new Uint8Array(3)
        pzColorsFace1[0] = a === 0 ? shadow : light
        pzColorsFace1[1] = b === 0 ? shadow : light
        pzColorsFace1[2] = c === 0 ? shadow : light

        output[2] = [pzColorsFace0, pzColorsFace1, [0, 0, 0]]
      }
    }

    if (Helpers.isTransparent(nx)) {
      const a =
        !Helpers.isTransparent(nxny) ||
        !Helpers.isTransparent(nxnz) ||
        !Helpers.isTransparent(nxnzny)
          ? 0
          : 1
      const b =
        !Helpers.isTransparent(nxny) ||
        !Helpers.isTransparent(nxpz) ||
        !Helpers.isTransparent(nxpzny)
          ? 0
          : 1
      const c =
        !Helpers.isTransparent(nxpy) ||
        !Helpers.isTransparent(nxpz) ||
        !Helpers.isTransparent(nxpzpy)
          ? 0
          : 1
      const d =
        !Helpers.isTransparent(nxpy) ||
        !Helpers.isTransparent(nxnz) ||
        !Helpers.isTransparent(nxnzpy)
          ? 0
          : 1

      const e = !Helpers.isTransparent(nxnzny) ? 0 : 1
      const f = !Helpers.isTransparent(nxpzny) ? 0 : 1
      const g = !Helpers.isTransparent(nxpzpy) ? 0 : 1
      const h = !Helpers.isTransparent(nxnzpy) ? 0 : 1

      if (e + g > f + h) {
        const nx2ColorsFace0 = new Uint8Array(3)
        nx2ColorsFace0[0] = b === 0 ? shadow : light
        nx2ColorsFace0[1] = a === 0 ? shadow : light
        nx2ColorsFace0[2] = c === 0 ? shadow : light

        const nx2ColorsFace1 = new Uint8Array(3)
        nx2ColorsFace1[0] = a === 0 ? shadow : light
        nx2ColorsFace1[1] = d === 0 ? shadow : light
        nx2ColorsFace1[2] = c === 0 ? shadow : light

        output[3] = [nx2ColorsFace0, nx2ColorsFace1, [1, 1, 1]]
      } else {
        const nxColorsFace0 = new Uint8Array(3)
        nxColorsFace0[0] = c === 0 ? shadow : light
        nxColorsFace0[1] = b === 0 ? shadow : light
        nxColorsFace0[2] = d === 0 ? shadow : light

        const nxColorsFace1 = new Uint8Array(3)
        nxColorsFace1[0] = b === 0 ? shadow : light
        nxColorsFace1[1] = a === 0 ? shadow : light
        nxColorsFace1[2] = d === 0 ? shadow : light

        output[3] = [nxColorsFace0, nxColorsFace1, [0, 0, 0]]
      }
    }

    if (Helpers.isTransparent(nz)) {
      const a =
        !Helpers.isTransparent(nzny) ||
        !Helpers.isTransparent(nxnz) ||
        !Helpers.isTransparent(nxnzny)
          ? 0
          : 1
      const b =
        !Helpers.isTransparent(nzny) ||
        !Helpers.isTransparent(pxnz) ||
        !Helpers.isTransparent(pxnzny)
          ? 0
          : 1
      const c =
        !Helpers.isTransparent(nzpy) ||
        !Helpers.isTransparent(pxnz) ||
        !Helpers.isTransparent(pxnzpy)
          ? 0
          : 1
      const d =
        !Helpers.isTransparent(nzpy) ||
        !Helpers.isTransparent(nxnz) ||
        !Helpers.isTransparent(nxnzpy)
          ? 0
          : 1

      const e = !Helpers.isTransparent(nxnzny) ? 0 : 1
      const f = !Helpers.isTransparent(pxnzny) ? 0 : 1
      const g = !Helpers.isTransparent(pxnzpy) ? 0 : 1
      const h = !Helpers.isTransparent(nxnzpy) ? 0 : 1

      if (e + g < f + h) {
        const nz2ColorsFace0 = new Uint8Array(3)
        nz2ColorsFace0[0] = a === 0 ? shadow : light
        nz2ColorsFace0[1] = b === 0 ? shadow : light
        nz2ColorsFace0[2] = d === 0 ? shadow : light

        const nz2ColorsFace1 = new Uint8Array(3)
        nz2ColorsFace1[0] = b === 0 ? shadow : light
        nz2ColorsFace1[1] = c === 0 ? shadow : light
        nz2ColorsFace1[2] = d === 0 ? shadow : light

        output[4] = [nz2ColorsFace0, nz2ColorsFace1, [1, 1, 1]]
      } else {
        const nzColorsFace0 = new Uint8Array(3)
        nzColorsFace0[0] = d === 0 ? shadow : light
        nzColorsFace0[1] = a === 0 ? shadow : light
        nzColorsFace0[2] = c === 0 ? shadow : light

        const nzColorsFace1 = new Uint8Array(3)
        nzColorsFace1[0] = a === 0 ? shadow : light
        nzColorsFace1[1] = b === 0 ? shadow : light
        nzColorsFace1[2] = c === 0 ? shadow : light

        output[4] = [nzColorsFace0, nzColorsFace1, [0, 0, 0]]
      }
    }

    if (Helpers.isTransparent(ny)) {
      const a =
        !Helpers.isTransparent(nxny) ||
        !Helpers.isTransparent(nzny) ||
        !Helpers.isTransparent(nxnzny)
          ? 0
          : 1
      const b =
        !Helpers.isTransparent(nxny) ||
        !Helpers.isTransparent(pzny) ||
        !Helpers.isTransparent(nxpzny)
          ? 0
          : 1
      const c =
        !Helpers.isTransparent(pxny) ||
        !Helpers.isTransparent(pzny) ||
        !Helpers.isTransparent(pxpzny)
          ? 0
          : 1
      const d =
        !Helpers.isTransparent(pxny) ||
        !Helpers.isTransparent(nzny) ||
        !Helpers.isTransparent(pxnzny)
          ? 0
          : 1

      const e = !Helpers.isTransparent(nxnzny) ? 0 : 1
      const f = !Helpers.isTransparent(nxpzny) ? 0 : 1
      const g = !Helpers.isTransparent(pxpzny) ? 0 : 1
      const h = !Helpers.isTransparent(pxnzny) ? 0 : 1

      if (e + g > f + h) {
        const ny2ColorsFace0 = new Uint8Array(3)
        ny2ColorsFace0[0] = b === 0 ? shadow : light
        ny2ColorsFace0[1] = c === 0 ? shadow : light
        ny2ColorsFace0[2] = a === 0 ? shadow : light

        const ny2ColorsFace1 = new Uint8Array(3)
        ny2ColorsFace1[0] = c === 0 ? shadow : light
        ny2ColorsFace1[1] = d === 0 ? shadow : light
        ny2ColorsFace1[2] = a === 0 ? shadow : light

        output[5] = [ny2ColorsFace0, ny2ColorsFace1, [1, 1, 1]]
      } else {
        const nyColorsFace0 = new Uint8Array(3)
        nyColorsFace0[0] = a === 0 ? shadow : light
        nyColorsFace0[1] = b === 0 ? shadow : light
        nyColorsFace0[2] = d === 0 ? shadow : light

        const nyColorsFace1 = new Uint8Array(3)
        nyColorsFace1[0] = b === 0 ? shadow : light
        nyColorsFace1[1] = c === 0 ? shadow : light
        nyColorsFace1[2] = d === 0 ? shadow : light

        output[5] = [nyColorsFace0, nyColorsFace1, [0, 0, 0]]
      }
    }

    return output
  }

  setLightingData = (lightingData, smoothLightingData, voxelData, coordx, coordy, coordz) => {
    if (!voxelData.data.find(ele => ele)) return

    const offsets = [
      coordx * SIZE - NEIGHBOR_WIDTH,
      coordy * SIZE - NEIGHBOR_WIDTH,
      coordz * SIZE - NEIGHBOR_WIDTH
    ]

    for (let x = NEIGHBOR_WIDTH; x < SIZE + NEIGHBOR_WIDTH; x++)
      for (let z = NEIGHBOR_WIDTH; z < SIZE + NEIGHBOR_WIDTH; z++)
        for (let y = NEIGHBOR_WIDTH; y < SIZE + NEIGHBOR_WIDTH; y++) {
          if (!Helpers.isLiquid(voxelData.get(x, z, y))) {
            const tempCoords = Helpers.getAbsoluteCoords(x, y, z, offsets)

            const tempx = tempCoords.x
            const tempy = tempCoords.y
            const tempz = tempCoords.z

            const lighting = this.getBlockLighting(tempx, tempy, tempz, voxelData, offsets)
            for (let l = 0; l < 6; l++) {
              lightingData.set(
                x - NEIGHBOR_WIDTH,
                z - NEIGHBOR_WIDTH,
                y - NEIGHBOR_WIDTH,
                l,
                lighting[l]
              )
            }

            const smoothLighting = this.getBlockSmoothLighting(x, y, z, voxelData)
            for (let l = 0; l < 6; l++) {
              if (smoothLighting[l]) {
                for (let m = 0; m < 3; m++)
                  for (let n = 0; n < 3; n++) {
                    smoothLightingData.set(
                      x - NEIGHBOR_WIDTH,
                      z - NEIGHBOR_WIDTH,
                      y - NEIGHBOR_WIDTH,
                      l,
                      m,
                      n,
                      smoothLighting[l][m][n]
                    )
                  }
              }
            }
          }
        }
  }
}

export default LightingManager
