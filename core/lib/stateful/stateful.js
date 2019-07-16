class Stateful {
  constructor(defaultState = {}) {
    this.state = defaultState
  }

  setState = arg => {
    if (typeof arg === 'object') {
      this.state = {
        ...this.state,
        ...arg
      }
    } else if (typeof arg === 'function') {
      this.state = arg(this.state)
    } else {
      throw new Error('Unknown `setState` argument.')
    }
  }
}

export default Stateful
