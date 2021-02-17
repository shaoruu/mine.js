const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  context: path.resolve(__dirname, '..'),
  entry: path.resolve(__dirname, '../src/index.ts'),
  module: {
    rules: [
      // TS
      {
        test: /(\.tsx|\.ts)$/,
        use: [
          { loader: 'cache-loader' },
          {
            loader: 'thread-loader',
            options: {
              // there should be 1 cpu for the fork-ts-checker-webpack-plugin
              workers: require('os').cpus().length - 1,
            },
          },
          {
            loader: 'ts-loader',
            options: {
              happyPackMode: true, // IMPORTANT! use happyPackMode mode to speed-up compilation and reduce errors reported to webpack
            },
          },
        ],
        exclude: /(node_modules|bower_components)/,
      },

      // JS
      {
        test: /(\.jsx|\.js)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/,
      },
      {
        test: /(\.jsx|\.js)$/,
        loader: 'eslint-loader',
        exclude: /node_modules/,
      },

      // Fonts
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'assets/fonts/',
            },
          },
        ],
      },

      // Shaders
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ['raw-loader'],
      },
    ],
  },
  resolve: {
    modules: [path.resolve('node_modules'), path.resolve('src')],
    extensions: ['.json', '.js', '.jsx', '.ts', '.tsx'],
    fallback: {
      util: require.resolve('util/'),
      buffer: require.resolve('buffer/'),
    },
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
};
