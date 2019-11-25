const projectTag = 'mine.js'

const BlockDict = {
  0: {
    name: 'empty',
    tag: `${projectTag}:empty`
  },
  1: {
    name: 'stone',
    tag: `${projectTag}:stone`
  },
  2: {
    name: 'grass',
    tag: `${projectTag}:grass`
  },
  3: {
    name: 'dirt',
    tag: `${projectTag}:dirt`
  },
  7: {
    name: 'bedrock',
    tag: `${projectTag}:bedrock`
  },
  9: {
    name: 'water',
    tag: `${projectTag}:water`
  },
  12: {
    name: 'sand',
    tag: `${projectTag}:sand`
  },
  17: {
    name: 'log_oak',
    tag: `${projectTag}:log_oak`
  },
  18: {
    name: 'leaves_oak',
    tag: `${projectTag}:leaves_oak`
  },
  31: {
    name: 'tallgrass',
    tag: `${projectTag}:tallgrass`
  },
  95: {
    name: 'stained_glass',
    tag: `${projectTag}:stained_glass`
  }
}

export default BlockDict

export const BLOCKS = {
  EMPTY: 0,
  STONE: 1,
  GRASS: 2,
  DIRT: 3,
  BEDROCK: 7,
  WATER: 9,
  SAND: 12,
  LOG_OAK: 17,
  LEAVES_OAK: 18,
  TALLGRASS: 31,
  STAINED_GLASS: 95
}
