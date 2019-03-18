[![Build Status](https://travis-ci.org/mike-marcacci/fs-capacitor.svg?branch=master)](https://travis-ci.org/mike-marcacci/fs-capacitor)
[![Current Version](https://badgen.now.sh/npm/v/fs-capacitor)](https://www.npmjs.com/package/fs-capacitor)
[![Required Node Version](https://badgen.now.sh/npm/node/fs-capacitor)](https://www.npmjs.com/package/fs-capacitor)

# FS Capacitor

FS Capacitor is a filesystem buffer for finite node streams. It supports simultaneous read/write, and can be used to create multiple independent readable streams, each starting at the beginning of the buffer.

This is useful for file uploads and other situations where you want to avoid delays to the source stream, but have slow downstream transformations to apply:

```js
import fs from "fs";
import http from "http";
import WriteStream from "fs-capacitor";

http.createServer((req, res) => {
  const capacitor = new WriteStream();
  const destination = fs.createReadStream("destination.txt");

  // pipe data to the capacitor
  req.pipe(capacitor);

  // read data from the capacitor
  capacitor
    .createReadStream()
    .pipe(/* some slow Transform streams here */)
    .pipe(destination);

  // read data from the very beginning
  setTimeout(() => {
    capacitor.createReadStream().pipe(/* elsewhere */);

    // you can destroy a capacitor as soon as no more read streams are needed
    // without worrying if existing streams are fully consumed
    capacitor.destroy();
  }, 100);
});
```

It is especially important to use cases like [apollo-upload-server](https://github.com/jaydenseric/apollo-upload-server/) where server code may need to stash earler parts of a stream until later parts have been processed, and needs to attach multiple consumers at different times.

FS Capacitor creates its temporary files in the directory ideneified by `os.tmpdir()` and attempts to remove them:

- after `readStream.destroy()` has been called and all read streams are fully consumed or destroyed
- before the process exits

Please do note that FS Capacitor does NOT release disk space _as data is consumed_, and therefore is not suitable for use with infinite streams or those larger than the filesystem.

## API

### WriteStream

`WriteStream` inherets all the methods of [`fs.WriteStream`](https://nodejs.org/api/fs.html#fs_class_fs_writestream)

#### Events

Note that listeners for the following terminating events will fire **even if the listener is added after the event occurred**:

- error
- close
- finish

#### Methods

- `new WriteStream()`

  Create a new `WriteStream` instance.

- `.createReadStream(): () => ReadStream`

  Create a new `ReadStream` instance attached to the `WriteStream` instance.

  Once a `WriteStream` is fully destroyed, calling `.createReadStream()` will throw a `ReadAfterDestroyedError` error.

  As soon as a `ReadStream` ends or is closed (such as by calling `readStream.destroy()`), it is detached from its `WriteStream`.

- `.destroy(error?: ?Error)`
  - If `error` is present, `WriteStream`s still attached are destroyed with the same error.
  - If `error` is null or undefined, destruction of underlying resources is delayed until no `ReadStream`s are attached the `WriteStream` instance.

### ReadStream

`ReadStream` inherets all the methods of [`fs.ReadStream`](https://nodejs.org/api/fs.html#fs_class_fs_readstream).

#### Events

Note that listeners for the following terminating events will fire **even if the listener is added after the event occurred**:

- error
- close
- end
