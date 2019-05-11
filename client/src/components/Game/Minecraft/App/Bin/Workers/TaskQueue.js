class TaskQueue {
  constructor() {
    this.tasks = []
  }

  addTask = (context, task, argument = null) => {
    this.tasks.push({
      context,
      task,
      argument
    })

    window.requestAnimationFrame(this.processTask)
  }

  addTasks = (context, tasks) => {
    tasks.forEach(([task, argument]) => {
      this.tasks.push({
        context,
        task,
        argument
      })
    })
    window.requestAnimationFrame(this.processTask)
  }

  processTask = () => {
    if (this.tasks.length === 0) return

    const { context, task, argument } = this.tasks.shift()

    task.call(context, argument)

    if (this.tasks.length) window.requestAnimationFrame(this.processTask)
  }
}

export default TaskQueue
