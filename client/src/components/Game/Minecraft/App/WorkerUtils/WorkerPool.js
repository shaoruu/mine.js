import WebWorker from './WebWorker'
// import Config from '../../Data/Config'

function WorkerPool(codes, world, config) {
  let availables = []

  const jobs = [],
    workers = []

  let priorityIndex = 0

  // TODO: Figure out what's wrong with this
  const maxWorkers = 1
  // (navigator.hardwareConcurrency || Config.world.maxWorkerCount) / 2

  for (let i = 0; i < maxWorkers; i++) {
    const newWorker = new WebWorker(codes)

    newWorker.addEventListener('message', e => {
      if (e.cmd !== 'BOOT') world.appendWorkerTask(world.workerCallback, e)

      nextJob(i)
    })

    workers.push(newWorker)

    // Booting up worker
    newWorker.postMessage({ cmd: 'BOOT', config })
  }

  // job: object containing specific actions to do for worker
  this.queueJob = (job, prioritized = false) => {
    if (prioritized) {
      jobs.splice(priorityIndex, 0, job)
      priorityIndex++
    } else jobs.push(job)
    if (availables.length > 0) nextJob(availables.shift())
  }

  this.broadcast = job => {
    for (let i = 0; i < workers.length; i++) workers[i].postMessage(job)
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

    if (priorityIndex) priorityIndex--
  }
}

export default WorkerPool
