class TaskQueue {
  constructor() {
    this.tasks = []
  }

  addTask = (task, argument = null) => {
    const shouldCall = this.tasks.length === 0

    this.tasks.push({
      task,
      argument
    })

    if (shouldCall) window.requestAnimationFrame(this.nextTask)
  }

  addTasks = tasks => {
    tasks.forEach(([task, argument]) => {
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
