import WebWorker from './simple-cull.worker';
console.log(WebWorker);

const worker = new WebWorker();
worker.postMessage({ a: 1 });
worker.onmessage = (event) => {
  console.log('event', event);
};

worker.addEventListener('message', (event) => {
  console.log('event', event);
});
console.log(worker);
