import WebWorker from './webWorker'
// import Config from '../../Data/Config'

function WorkerPool(codes, callback, config) {
  const gFrees = []
  const sFrees = []

  const gJobs = []
  const sJobs = []
  const generalWorkers = []
  const specializedWorkers = []

  // TODO: Figure out what's wrong with this
  const maxGWorkers = 1
  const maxSWorkers = 2
  // navigator.hardwareConcurrency || Config.world.maxWorkerCount

  function nextGJob(index) {
    // No job
    if (!gJobs.length) {
      gFrees.push(index)
      return
    }

    const job = gJobs.shift()
    const worker = generalWorkers[index]

    worker.postMessage(job)
  }

  function nextSJob(index) {
    // No job
    if (!sJobs.length) {
      sFrees.push(index)
      return
    }

    const job = sJobs.shift()
    const worker = specializedWorkers[index]

    worker.postMessage(job)
  }

  for (let i = 0; i < maxGWorkers; i++) {
    const newGWorker = new WebWorker(codes)

    newGWorker.onmessage = e => {
      if (e.cmd !== 'BOOT') window.requestAnimationFrame(() => callback(e))

      nextGJob(i)
    }

    generalWorkers.push(newGWorker)

    // Booting up general worker
    newGWorker.postMessage({ cmd: 'BOOT', config })
  }

  for (let i = 0; i < maxSWorkers; i++) {
    const newSWorker = new WebWorker(codes)

    newSWorker.onmessage = e => {
      if (e.cmd !== 'BOOT') callback(e)

      nextSJob(i)
    }

    specializedWorkers.push(newSWorker)

    // Booting up specialized worker
    newSWorker.postMessage({ cmd: 'BOOT', config })
  }

  // job: object containing specific actions to do for worker
  this.queueGJob = job => {
    gJobs.push(job)
    if (gFrees.length > 0) nextGJob(gFrees.shift())
  }

  this.queueSJob = job => {
    sJobs.push(job)
    if (sFrees.length > 0) nextSJob(sFrees.shift())
  }

  this.broadcast = job => {
    for (let i = 0; i < maxGWorkers; i++) {
      generalWorkers[i].postMessage(job)
    }
    for (let i = 0; i < maxSWorkers; i++) {
      specializedWorkers[i].postMessage(job)
    }
  }
}

export default WorkerPool
