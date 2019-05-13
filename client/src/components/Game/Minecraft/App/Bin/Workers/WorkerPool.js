import WebWorker from './WebWorker'
// import Config from '../../../Data/Config'

function WorkerPool(code, world) {
  let availables = []

  const jobs = [],
    workers = []

  let prioirityIndex = 0

  // TODO: Figure out what's wrong with this
  const maxWorkers = 1
  // navigator.hardwareConcurrency || Config.world.maxWorkerCount

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
  this.queueJob = (job, prioritized = false) => {
    if (prioritized) {
      jobs.splice(prioirityIndex, 0, job)
      prioirityIndex++
    } else jobs.push(job)
    if (availables.length > 0) nextJob(availables.shift())
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

    if (prioirityIndex) prioirityIndex--
  }
}

export default WorkerPool
