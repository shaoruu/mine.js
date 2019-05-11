import WebWorker from './WebWorker'
import Config from '../../../Data/Config'

function WorkerPool(code, world) {
  let availables = []

  const jobs = [],
    workers = []

  const maxWorkers = navigator.hardwareConcurrency || Config.world.maxWorkerCount

  for (let i = 0; i < maxWorkers; i++) {
    const newWorker = new WebWorker(code)

    newWorker.addEventListener('message', e => {
      if (e.cmd !== 'BOOT') world.appendWorkerTask(world.workerCallback, e)

      nextJob(i)
    })

    workers.push(newWorker)

    // Booting up worker
    newWorker.postMessage({ cmd: 'BOOT' })
  }

  // job: object containing specific actions to do for worker
  this.queueJob = job => {
    jobs.push(job)
    if (availables.length > 0) nextJob(availables.splice(0, 1))
  }

  function nextJob(index) {
    // No job
    if (!jobs.length) {
      availables.push(index)
      return
    }

    const job = jobs.shift(),
      worker = workers[index]

    worker.postMessage(job)
  }
}

export default WorkerPool
