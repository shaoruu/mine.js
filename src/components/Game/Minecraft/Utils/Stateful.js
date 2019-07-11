/**
 * This is just a simple class for state management
 */
class Stateful {
  constructor() {
    this.state = {}
  }

  setState = obj =>
    (this.state = {
      ...this.state,
      ...obj
    })
}

export default Stateful
