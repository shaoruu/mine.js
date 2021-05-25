export * from './models/base-block';

export const ID_TO_BLOCK = {
  // SOLIDS
  0: require('./models/air'),
  1: require('./models/dirt'),
  2: require('./models/grass-block'),
  3: require('./models/stone'),
  4: require('./models/glass'),
  5: require('./models/wood'),
  6: require('./models/stone-brick'),
  7: require('./models/ice'),
  8: require('./models/trunk'),
  9: require('./models/leaves'),

  // COLORS
  10: require('./models/blue'),
  11: require('./models/green'),
  12: require('./models/snow'),
  13: require('./models/yellow'),

  // SOLIDS
  20: require('./models/leaves-orange'),
  21: require('./models/sand'),
  22: require('./models/greysand'),
  23: require('./models/greystone'),
  24: require('./models/glass-frame'),

  // PLANTS
  50: require('./models/grass'),
  51: require('./models/brown-grass'),
  52: require('./models/tan-grass'),
  53: require('./models/brown-mushroom'),
  54: require('./models/tan-mushroom'),
  55: require('./models/red-mushroom'),
};
