const pkg = require('../package.json');

const commonConfiguration = require('./webpack.common.js');

const { merge } = require('webpack-merge');
const path = require('path');

module.exports = merge(commonConfiguration, {
  mode: 'development',
  devtool: 'source-map',
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
