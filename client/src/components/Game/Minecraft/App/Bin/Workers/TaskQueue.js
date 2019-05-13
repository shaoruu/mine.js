class TaskQueue {
  constructor() {
    this.tasks = []
  }

  addTask = (task, argument = null, configs = {}) => {
    const shouldCall = this.tasks.length === 0

    const { prioritized } = configs

    if (prioritized) this.tasks.unshift({ task, argument })
    else
      this.tasks.push({
        task,
        argument
      })

    if (shouldCall) window.requestAnimationFrame(this.nextTask)
  }

  addTasks = (tasks, configs = {}) => {
    const { prioritized } = configs
    tasks.forEach(([task, argument]) => {
      if (prioritized)
        this.tasks.unshift({
          task,
          argument
        })
      else
        this.tasks.push({
          task,
          argument
        })
    })
    window.requestAnimationFrame(this.nextTask)
  }

  nextTask = () => {
    if (this.tasks.length === 0) return

    const { task, argument } = this.tasks.shift()

    task(argument)

    if (this.tasks.length) window.requestAnimationFrame(this.nextTask)
  }
}

export default TaskQueue
