const { ProcessPool } = require('./pool')
const { Supervisor } = require('./supervisor')
const { Process } = require('./process')
const { Service } = require('./service')

/**
 * The top level module exports for the 'little-process-box' module.
 * @public
 * @namespace little-process-box
 * @type {Function|Object}
 */
module.exports = Object.assign(factory(ProcessPool), {
  // factories
  supervisor: factory(Supervisor),
  process: factory(Process),
  service: factory(Service),
  pool: factory(ProcessPool),

  // classes
  ProcessPool,
  Supervisor,
  Process,
  Service,
})

function factory(Class) {
  return (...args) => new Class(...args)
}
