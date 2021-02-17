/** helper to swap item to end and pop(), instead of splice()ing */
export function removeUnorderedListItem<T>(list: T[], item: T) {
  const i = list.indexOf(item);
  if (i < 0) {
    return;
  }

  if (i === list.length - 1) {
    list.pop();
  } else {
    list[i] = list.pop()!;
  }
}

/** loop over a function for a few ms, or until it returns true */
export function loopForTime<T>(maxTimeInMS: number, callback: () => T, startTime: number = performance.now()) {
  const cutoff = startTime + maxTimeInMS;
  const maxIter = 1000; // sanity check

  for (let i = 0; i < maxIter; i++) {
    const res = callback();
    if (res || performance.now() > cutoff) {
      return;
    }
  }
}

let prevRad = 0,
  prevAnswer = 0;
export function numberOfVoxelsInSphere(rad: number) {
  if (rad === prevRad) {
    return prevAnswer;
  }

  let ext = Math.ceil(rad),
    ct = 0,
    rsq = rad * rad;

  for (let i = -ext; i <= ext; ++i) {
    for (let j = -ext; j <= ext; ++j) {
      for (let k = -ext; k <= ext; ++k) {
        const dsq = i * i + j * j + k * k;
        if (dsq < rsq) ct++;
      }
    }
  }
  prevRad = rad;
  prevAnswer = ct;

  return ct;
}

/**
 * partly "unrolled" loops to copy contents of ndarrays
 * when there's no source, zeroes out the array instead
 */
export function copyNdarrayContents(
  src: any,
  tgt: any,
  pos: [number, number, number],
  size: [number, number, number],
  tgtPos: [number, number, number],
) {
  if (src) {
    doNdarrayCopy(src, tgt, pos[0], pos[1], pos[2], size[0], size[1], size[2], tgtPos[0], tgtPos[1], tgtPos[2]);
  } else {
    doNdarrayZero(tgt, tgtPos[0], tgtPos[1], tgtPos[2], size[0], size[1], size[2]);
  }
}

function doNdarrayCopy(
  src: any,
  tgt: any,
  i0: number,
  j0: number,
  k0: number,
  si: number,
  sj: number,
  sk: number,
  ti: number,
  tj: number,
  tk: number,
) {
  for (let i = 0; i < si; i++) {
    for (let j = 0; j < sj; j++) {
      let six = src.index(i0 + i, j0 + j, k0);
      let tix = tgt.index(ti + i, tj + j, tk);
      for (let k = 0; k < sk; k++) {
        tgt.data[tix] = src.data[six];
        six += src.stride[2];
        tix += tgt.stride[2];
      }
    }
  }
}

function doNdarrayZero(tgt: any, i0: number, j0: number, k0: number, si: number, sj: number, sk: number) {
  for (let i = 0; i < si; i++) {
    for (let j = 0; j < sj; j++) {
      let ix = tgt.index(i0 + i, j0 + j, k0);
      for (let k = 0; k < sk; k++) {
        tgt.data[ix] = 0;
        ix += tgt.stride[2];
      }
    }
  }
}

/**
 * simple thing for reporting time split up between several activities
 */
export function makeProfileHook(_every: number, _title: string) {
  const title = _title || '';
  const every = _every || 1;
  const times: any[] = [];
  const names: any[] = [];
  let started = 0;
  let last = 0;
  let iter = 0;
  let total = 0;
  let clearNext = true;

  const start = function () {
    if (clearNext) {
      times.length = names.length = 0;
      clearNext = false;
    }
    started = last = performance.now();
    iter++;
  };

  const add = function (name: any) {
    const t = performance.now();
    if (names.indexOf(name) < 0) names.push(name);
    const i = names.indexOf(name);
    if (!times[i]) times[i] = 0;
    times[i] += t - last;
    last = t;
  };

  const report = function () {
    total += performance.now() - started;
    if (iter === every) {
      const head = title + ' total ' + (total / every).toFixed(2) + 'ms (avg, ' + every + ' runs)    ';
      console.log(
        head,
        names
          .map(function (name, i) {
            return name + ': ' + (times[i] / every).toFixed(2) + 'ms    ';
          })
          .join(''),
      );
      clearNext = true;
      iter = 0;
      total = 0;
    }
  };

  return function profile_hook(state: any) {
    if (state === 'start') start();
    else if (state === 'end') report();
    else add(state);
  };
}

/**
 * simple thing for reporting time actions/sec
 */
export function makeThroughputHook(_every: number, _title: string) {
  const title = _title || '';
  const every = _every || 1;
  const counts: { [key: string]: any } = {};
  let started = performance.now();
  let iter = 0;

  return function profile_hook(state: any) {
    if (state === 'start') return;
    if (state === 'end') {
      if (++iter < every) return;
      const t = performance.now();
      console.log(
        title +
          '   ' +
          Object.keys(counts)
            .map((k) => {
              const through = (counts[k] / (t - started)) * 1000;
              counts[k] = 0;
              return k + ':' + through.toFixed(2) + '   ';
            })
            .join(''),
      );
      started = t;
      iter = 0;
    } else {
      if (!counts[state]) counts[state] = 0;
      counts[state]++;
    }
  };
}

/**
 * strList - internal data structure for lists of chunk IDs
 */
export class StringList {
  arr: string[] = [];
  hash: { [key: string]: boolean } = {};

  includes = (key: string) => {
    return this.hash[key];
  };

  add = (key: string) => {
    if (this.hash[key]) return;
    this.arr.push(key);
    this.hash[key] = true;
  };

  remove = (key: string) => {
    if (!this.hash[key]) return;
    this.arr.splice(this.arr.indexOf(key), 1);
    delete this.hash[key];
  };

  count = () => {
    return this.arr.length;
  };

  forEach = this.arr.forEach;

  slice = this.arr.slice;

  isEmpty = () => {
    return this.arr.length === 0;
  };

  empty = () => {
    this.arr.length = 0;
    this.hash = {};
  };

  pop = () => {
    const key = this.arr.pop()!;
    delete this.hash[key];
    return key;
  };

  sort = (keyToDistanceFn: (key: string) => number) => {
    const mapping: { [key: string]: number } = {};
    this.arr.forEach((key) => {
      mapping[key] = keyToDistanceFn(key);
    });

    this.arr.sort((a, b) => mapping[b] - mapping[a]); // DESCENDING!
  };

  copyFrom = (list: StringList) => {
    this.arr = list.arr.slice();
    this.hash = Object.assign({}, list.hash);
  };
}
