import WorkerMain from './Main.worker'
import WorkerGenerator from './Generator.worker'
import WorkerImports from './Imports.worker'
import WorkerHelpers from './Helpers.worker'

export default [WorkerGenerator, WorkerImports, WorkerHelpers, WorkerMain]
