class TaskQueue {
  constructor() {
    this.tasks = []
    this.priorityIndex = 0
  }

  addTask = (task, argument = null, configs = {}) => {
    const shouldCall = this.tasks.length === 0

    const { prioritized } = configs

    const formattedTask = { task, argument }

    if (prioritized) {
      this.tasks.splice(this.priorityIndex, 0, formattedTask)
      this.priorityIndex++
    } else this.tasks.push(formattedTask)

    if (shouldCall) window.requestAnimationFrame(this.nextTask)
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

    window.requestAnimationFrame(this.nextTask)
  }

  nextTask = () => {
    if (this.tasks.length === 0) return

    const { task, argument } = this.tasks.shift()

    task(argument)

    if (this.priorityIndex) this.priorityIndex--

    if (this.tasks.length) window.requestAnimationFrame(this.nextTask)
  }
}

export default TaskQueue
