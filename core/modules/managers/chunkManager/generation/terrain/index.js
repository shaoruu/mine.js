import classicWorkerMain from './classicGenerator/main.worker'
import classicWorkerGenerator from './classicGenerator/classicGenerator.worker'
import classicWorkerImports from './classicGenerator/imports.worker'
import classicWorkerHelpers from './classicGenerator/helpers.worker'

export const classicGeneratorCode = [
  classicWorkerImports,
  classicWorkerHelpers,
  classicWorkerGenerator,
  classicWorkerMain
]
