const pkg = require('../package.json');

const commonConfiguration = require('./webpack.common.js');

const { merge } = require('webpack-merge');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const path = require('path');
const gulp = require('gulp');

require('../gulpfile');

const smp = new SpeedMeasurePlugin();

const devConfigs = merge(commonConfiguration, {
  mode: 'development',
  devtool: 'source-map',
  cache: {
    type: 'memory',
  },
  output: {
    filename: pkg.umd,
    path: path.resolve(__dirname, '../dist'),
    library: 'MineJS',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'this',
  },
  watch: true,
});

let hasBuilt = false;
devConfigs.plugins.push({
  apply: (compiler) => {
    compiler.hooks.afterEmit.tap('AfterEmitPlugin', () => {
      if (!hasBuilt) {
        gulp.task('serve')();
      }

      hasBuilt = true;
    });
  },
});

module.exports = smp.wrap(devConfigs);
