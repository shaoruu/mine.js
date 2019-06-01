import Helpers from '../../../../Utils/Helpers'
import Config from '../../../../Data/Config'

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
            (!keyState.config.repeat && keyState.isPressed !== true) ||
            keyState.config.repeat
          )
            keyState.onPressed(e)
        }

        keyState.state.isPressed = true
      } catch (err) {
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
          window.setTimeout(
            () => (keyState.dblPressedPotential = undefined),
            Config.keyboard.dblTimeout
          )
        }

        if (keyState.onReleased) keyState.onReleased(e)

        keyState.state.isPressed = keyState.state.isDblPressed = false
      } catch (err) {
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
    const keyState = this._genEmptyKeyState()
    const { repeat, immediate } = config

    keyState.onPressed = onPressed
    keyState.onReleased = onReleased
    keyState.onDblPressed = onDblPressed

    keyState.config.repeat = repeat
    keyState.config.immediate = immediate

    if (!this.keyStates[scope]) this.keyStates[scope] = {}

    this.keyStates[scope][keyCode] = keyState
  }

  registerIndexedKeyGroup = (group, scope, onPressed) => {
    const wrapped = event => {
      const index = group.indexOf(event.keyCode)
      onPressed(index)
    }

    for (let i = 0; i < group.length; i++)
      this.registerKey(group[i], scope, wrapped)
  }

  setScopeDefaultHandler = (scope, onPressed) => {
    if (!this.keyStates[scope]) this.keyStates[scope] = {}

    this.keyStates[scope].default = onPressed
  }

  setScope = scope => (this.scope = scope)

  /**
   * INTERNAL FUNCTIONS
   */
  _genEmptyKeyState = () => ({
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
