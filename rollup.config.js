import pkg from './package.json';

import typescript from 'rollup-plugin-typescript2';
import builtins from 'rollup-plugin-node-builtins';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    },
    {
      file: pkg.umd,
      extend: true,
      format: 'umd',
      indent: false,
      name: 'MineJS',
    },
  ],
  external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
  plugins: [
    builtins(),
    typescript({
      typescript: require('typescript'),
    }),
  ],
};
