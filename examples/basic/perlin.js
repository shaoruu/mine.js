// https://gist.github.com/esimov/586a439f53f62f67083e

var NOISE = NOISE || {};

NOISE.Perlin = function () {
  var iOctaves = 1,
    fPersistence = 0.2,
    fResult,
    fFreq,
    fPers,
    aOctFreq, // frequency per octave
    aOctPers, // persistance per octave
    fPersMax; // 1 / max persistence

  var octaveFreq = function () {
    var fFreq, fPers;
    aOctFreq = [];
    aOctPers = [];
    fPersMax = 0;

    for (var i = 0; i < iOctaves; i++) {
      fFreq = Math.pow(2, i);
      fPers = Math.pow(fPersistence, i);
      fPersMax += fPers;
      aOctFreq.push(fFreq);
      aOctPers.push(fPers);
    }

    fPersMax = 2 / fPersMax;
  };

  var perm = new Uint8Array(512);
  var p = new Uint8Array(256);

  var grad3 = [
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
    [0, 1, 1],
    [0, -1, 1],
    [0, 1, -1],
    [0, -1, -1],
  ];

  // Return the dot product for 2d perlin noise
  function dot2(g, x, y) {
    return g[0] * x + g[1] * y;
  }

  // Return the dot product for 3d perlin noise
  function dot3(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }

  // Seeded random number generator
  function seed(x) {
    x = (x << 13) ^ x;
    return 1.0 - ((x * (x * x * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0;
  }

  function init() {
    for (var i = 0; i < 256; i++) {
      p[i] = Math.abs(~~(seed(i) * 256));
    }

    // To remove the need for index wrapping, double the permutation table length
    for (var i = 0; i < 512; i++) {
      perm[i] = p[i & 255];
    }
  }

  /*
   ** 2D Simplex Noise
   */
  function noise2D(x, y, z) {
    // Find unit grid cell containing point
    var X = Math.floor(x) & 255;
    var Y = Math.floor(y) & 255;

    // Get relative xyz coordinates of point within that cell
    x -= Math.floor(x);
    y -= Math.floor(y);

    var fade = function (t) {
      return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    };

    var lerp = function (a, b, t) {
      return (1.0 - t) * a + t * b;
    };

    var u = fade(x),
      v = fade(y);

    // Calculate a set of four hashed gradient indices
    var n00 = perm[X + perm[Y]] % 12;
    var n01 = perm[X + perm[Y + 1]] % 12;
    var n10 = perm[X + 1 + perm[Y + 1]] % 12;
    var n11 = perm[X + 1 + perm[Y + 1]] % 12;

    // Calculate noise contributions from each of the four corners
    var gi00 = dot2(grad3[n00], x, y);
    var gi01 = dot2(grad3[n01], x, y - 1);
    var gi10 = dot2(grad3[n10], x - 1, y);
    var gi11 = dot2(grad3[n11], x - 1, y - 1);

    // Interpolate the results along axises
    return lerp(lerp(gi00, gi10, u), lerp(gi01, gi11, u), v);
  }

  /*
   ** 3D Simplex Noise
   */
  function noise3D(x, y, z) {
    // Find unit grid cell containing point
    var X = Math.floor(x) & 255;
    var Y = Math.floor(y) & 255;
    var Z = Math.floor(z) & 255;

    // Get relative xyz coordinates of point within that cell
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    var fade = function (t) {
      return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    };

    var lerp = function (a, b, t) {
      return (1.0 - t) * a + t * b;
    };

    var u = fade(x),
      v = fade(y),
      w = fade(z);

    // Calculate a set of eight hashed gradient indices
    var n000 = perm[X + perm[Y + perm[Z]]] % 12;
    var n001 = perm[X + perm[Y + perm[Z + 1]]] % 12;
    var n010 = perm[X + perm[Y + 1 + perm[Z]]] % 12;
    var n011 = perm[X + perm[Y + 1 + perm[Z + 1]]] % 12;
    var n100 = perm[X + 1 + perm[Y + perm[Z]]] % 12;
    var n101 = perm[X + 1 + perm[Y + perm[Z + 1]]] % 12;
    var n110 = perm[X + 1 + perm[Y + 1 + perm[Z]]] % 12;
    var n111 = perm[X + 1 + perm[Y + 1 + perm[Z + 1]]] % 12;

    // Calculate noise contributions from each of the eight corners
    var gi000 = dot3(grad3[n000], x, y, z);
    var gi001 = dot3(grad3[n001], x, y, z - 1);
    var gi010 = dot3(grad3[n010], x, y - 1, z);
    var gi011 = dot3(grad3[n011], x, y - 1, z - 1);
    var gi100 = dot3(grad3[n100], x - 1, y, z);
    var gi101 = dot3(grad3[n101], x - 1, y, z - 1);
    var gi110 = dot3(grad3[n110], x - 1, y - 1, z);
    var gi111 = dot3(grad3[n111], x - 1, y - 1, z - 1);

    // Interpolate the results along axises
    return lerp(
      lerp(lerp(gi000, gi100, u), lerp(gi001, gi101, u), w),
      lerp(lerp(gi010, gi110, u), lerp(gi011, gi111, u), w),
      v,
    );
  }

  function PerlinNoise() {}

  PerlinNoise.prototype = {
    init: init,

    noise: function (x, y, z) {
      fResult = 0;

      for (var i = 0; i < iOctaves; i++) {
        fFreq = aOctFreq[i];
        fPers = aOctPers[i];

        switch (arguments.length) {
          case 3:
            fResult += fPers * noise3D(fFreq * x, fFreq * y, fFreq * z);
            break;
          case 2:
            fResult += fPers * noise2D(fFreq * x, fFreq * y);
            break;
          default:
            fResult += fPers * noise3D(fFreq * x, fFreq * y, fFreq * z);
            break;
        }
      }

      return (fResult * fPersMax + 0.8) * 0.5;
    },

    noiseDetail: function (octaves, persistance) {
      iOctaves = octaves || iOctaves;
      fPersistence = persistance || fPersistence;
      octaveFreq();
    },
  };

  return PerlinNoise;
}.call(this);
