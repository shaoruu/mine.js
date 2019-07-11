export default class WebWorker {
  constructor(codes) {
    let complete = `function() {`

    for (let i = 0; i < codes.length; i++) {
      const codeString = codes[i].toString()

      complete += codeString.substr(codeString.indexOf('{'), codeString.lastIndexOf('}'))
    }

    complete += '}'

    const blob = new Blob(['(' + complete + ')()'])
    return new Worker(URL.createObjectURL(blob))
  }
}
