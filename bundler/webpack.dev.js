const path = require('path');

const gulp = require('gulp');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const { merge } = require('webpack-merge');

const pkg = require('../package.json');

const commonConfiguration = require('./webpack.common.js');

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
        gulp.task('classic')();
      }

      hasBuilt = true;
    });
  },
});

module.exports = smp.wrap(devConfigs);
