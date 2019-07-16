import WorkerPool from './workerPool'

class WorkerManager {
  initChunkPool = (codes, callback, configs) => {
    this.chunkWorkerPool = new WorkerPool(codes, callback, configs)
  }

  queueSChunk = job => this.chunkWorkerPool.queueSJob(job)

  queueGChunk = job => this.chunkWorkerPool.queueGJob(job)

  broadcastChunk = job => this.chunkWorkerPool.broadcast(job)
}

export default WorkerManager
