const pkg = require('../package.json');

const commonConfiguration = require('./webpack.common.js');

const { merge } = require('webpack-merge');
const path = require('path');

const config = merge(commonConfiguration, {
  mode: 'production',
});

const commonjsConfig = {
  ...config,
  output: {
    filename: pkg.main,
    path: path.resolve(__dirname, '../dist'),
    libraryTarget: 'commonjs2',
  },
};

const umdConfig = {
  ...config,
  output: {
    filename: pkg.umd,
    path: path.resolve(__dirname, '../dist'),
    library: 'MineJS',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'this',
  },
};

module.exports = [commonjsConfig, umdConfig];
