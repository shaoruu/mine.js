import Config from '../../../config/config'

function WorkerPool(Worker, callback, config) {
  const gFrees = []
  const sFrees = []

  const gJobs = []
  const sJobs = []

  const generalWorkers = []
  const specializedWorkers = []

  // TODO: Figure out what's wrong with this
  // const maxGWorkers =
  //   navigator.hardwareConcurrency || Config.world.maxWorkerCount
  const maxGWorkers = Config.tech.maxWorkerCount
  const maxSWorkers = Config.tech.maxWorkerCount

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
    const newGWorker = new Worker()

    newGWorker.onmessage = function(e) {
      if (e.cmd !== 'BOOT') callback(e)

      gFrees.push(i)
    }

    generalWorkers.push(newGWorker)

    // Booting up general worker
    newGWorker.postMessage({ cmd: 'BOOT', config })
  }

  for (let i = 0; i < maxSWorkers; i++) {
    const newSWorker = new Worker()

    newSWorker.onmessage = function(e) {
      if (e.cmd !== 'BOOT') callback(e)

      sFrees.push(i)
    }

    specializedWorkers.push(newSWorker)

    // Booting up specialized worker
    newSWorker.postMessage({ cmd: 'BOOT', config })
  }

  // job: object containing specific actions to do for worker
  this.queueGJob = job => {
    gJobs.push(job)
  }

  this.queueSJob = job => {
    sJobs.push(job)
  }

  this.broadcast = job => {
    for (let i = 0; i < maxGWorkers; i++) {
      generalWorkers[i].postMessage(job)
    }
    for (let i = 0; i < maxSWorkers; i++) {
      specializedWorkers[i].postMessage(job)
    }
  }

  this.update = () => {
    if (gFrees.length > 0 && gJobs.length !== 0) nextGJob(gFrees.shift())
    if (sFrees.length > 0 && sJobs.length !== 0) nextSJob(sFrees.shift())
  }
}

export default WorkerPool
