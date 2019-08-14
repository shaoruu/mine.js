import Helpers from '../../utils/helpers'
import Config from '../../config/config'

class Keyboard {
  constructor() {
    this.scope = 'default'

    this.keyStates = {}
  }

  initialize = () => {
    this.onPressedListener = document.addEventListener('keydown', e => {
      const keyScope = this.keyStates[this.scope]

      if (!keyScope) return

      const keyState = keyScope[e.keyCode]

      if (!keyState) {
        if (keyScope.default) keyScope.default(e)
        return
      }

      try {
        if (keyState.dblPressedPotential) {
          // Double pressed!
          keyState.onDblPressed(e)
          keyState.state.isDblPressed = true

          keyState.dblPressedPotential = false // Set to falsey value to indicate dbl pressed.

          if (keyState.config.immediate && keyState.onPressed)
            keyState.onPressed(e)
        } else if (keyState.onPressed) {
          if (
            (!keyState.config.repeat && !keyState.state.isPressed) ||
            keyState.config.repeat
          )
            keyState.onPressed(e)
        }

        keyState.state.isPressed = true
      } catch (err) {
        Helpers.error(err)
        Helpers.log(`Failed to execute onPressed() for key ${e.keyCode}`)
      }
    })

    this.onReleasedListener = document.addEventListener('keyup', e => {
      const keyScope = this.keyStates[this.scope]

      if (!keyScope) return

      const keyState = keyScope[e.keyCode]

      if (!keyState) return

      try {
        if (
          keyState.onDblPressed &&
          keyState.dblPressedPotential === undefined
        ) {
          keyState.dblPressedPotential = true

          // Double press will not work after x seconds.
          const dblPTimeout = window.requestTimeout(() => {
            keyState.dblPressedPotential = undefined
            window.clearRequestTimeout(dblPTimeout)
          }, Config.keyboard.dblTimeout)
        }

        if (keyState.onReleased) keyState.onReleased(e)

        keyState.state.isPressed = false
        keyState.state.isDblPressed = false
      } catch (err) {
        Helpers.error(err)
        Helpers.log(`Failed to execute onReleased() for key ${e.keyCode}`)
      }
    })
  }

  registerKey = (
    keyCode,
    scope,
    onPressed,
    onReleased = undefined,
    onDblPressed = undefined,
    config = { repeat: true, immediate: false }
  ) => {
    const keyState = this.genEmptyKeyState()
    const { repeat, immediate } = config

    keyState.onPressed = onPressed
    keyState.onReleased = onReleased
    keyState.onDblPressed = onDblPressed

    keyState.config.repeat = repeat
    keyState.config.immediate = immediate

    if (!this.keyStates[scope]) this.keyStates[scope] = {}

    this.keyStates[scope][keyCode] = keyState
  }

  registerKeys = (
    keyArr,
    scope,
    onPressed,
    onReleased = undefined,
    onDblPressed = undefined,
    config
  ) => {
    for (let i = 0; i < keyArr.length; i++) {
      const keyCode = keyArr[i]

      this.registerKey(
        keyCode,
        scope,
        onPressed,
        onReleased,
        onDblPressed,
        config
      )
    }
  }

  registerIndexedKeyGroup = (group, scope, onPressed) => {
    if (Array.isArray(group)) {
      const wrapped = event => {
        const index = group.indexOf(event.keyCode)
        onPressed(index)
      }
      for (let i = 0; i < group.length; i++) {
        this.registerKey(group[i], scope, wrapped)
      }
    } else {
      Object.keys(group).forEach(key => {
        const index = parseInt(key.split('h')[1], 0)
        this.registerKey(group[key], scope, () => {
          onPressed(index)
        })
      })
    }
  }

  setScopeDefaultHandler = (scope, onPressed) => {
    if (!this.keyStates[scope]) this.keyStates[scope] = {}

    this.keyStates[scope].default = onPressed
  }

  setScope = scope => (this.scope = scope)

  /* -------------------------------------------------------------------------- */
  /*                             INTERNAL FUNCTIONS                             */
  /* -------------------------------------------------------------------------- */
  genEmptyKeyState = () => ({
    state: {
      isPressed: false,
      isDblPressed: false
    },
    onPressed: undefined,
    onReleased: undefined,
    onDblPressed: undefined,
    dblPressedPotential: undefined,
    config: {
      repeat: true,
      immediate: false
    }
  })
}

export default Keyboard
