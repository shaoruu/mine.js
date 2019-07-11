const path = require('path')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')

const paths = {
  core: 'core/'
}

module.exports = function override(config, env) {
  config.module.rules[2].oneOf[1].include = [config.module.rules[2].oneOf[1].include]

  Object.keys(paths).forEach(key => {
    const p = paths[key]

    config.resolve.alias[key] = path.resolve(__dirname, p)

    config.module.rules[1].include = [config.module.rules[1].include, path.resolve(__dirname, p)]

    config.module.rules[2].oneOf[1].include.push(path.resolve(__dirname, p))
  })

  config.resolve.plugins = config.resolve.plugins.filter(
    plugin => !(plugin instanceof ModuleScopePlugin)
  )

  return config
}
