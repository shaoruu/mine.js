class TaskQueue {
  constructor() {
    this.tasks = []
    this.priorityIndex = 0
  }

  addTask = (task, argument = null, configs = {}) => {
    const { prioritized } = configs

    const formattedTask = { task, argument }

    if (prioritized) {
      this.tasks.splice(this.priorityIndex, 0, formattedTask)
      this.priorityIndex++
    } else this.tasks.push(formattedTask)
  }

  addTasks = (tasks, configs = {}) => {
    const { prioritized } = configs

    tasks.forEach(([task, argument]) => {
      const formattedTask = { task, argument }
      if (prioritized) {
        this.tasks.splice(this.priorityIndex, 0, formattedTask)
        this.priorityIndex++
      } else this.tasks.push(formattedTask)
    })
  }

  nextTask = () => {
    const { task, argument } = this.tasks.shift()

    if (Array.isArray(argument)) task(...argument)
    else task(argument)

    if (this.priorityIndex) this.priorityIndex--
  }

  update = () => {
    if (this.tasks.length !== 0) this.nextTask()
  }
}

export default TaskQueue
