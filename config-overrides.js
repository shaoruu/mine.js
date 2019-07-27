const path = require('path')
const {
  removeModuleScopePlugin,
  override,
  babelInclude,
  addWebpackAlias
} = require('customize-cra')

module.exports = override(
  (() => config => {
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader', options: { inline: true } }
    })

    config.output.globalObject = 'this'

    return config
  })(),
  removeModuleScopePlugin(),
  babelInclude([path.resolve(__dirname, 'src'), path.resolve(__dirname, 'core')]),
  addWebpackAlias({
    ['core']: path.resolve(__dirname, 'core')
  })
)
