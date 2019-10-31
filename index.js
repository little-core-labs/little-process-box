const { ProcessPool } = require('./pool')
const { Supervisor } = require('./supervisor')
const { Channel } = require('./channel')
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
  channel: factory(Channel),
  process: factory(Process),
  service: factory(Service),
  pool: factory(ProcessPool),

  // classes
  ProcessPool,
  Supervisor,
  Channel,
  Process,
  Service,
})

function factory(Class) {
  return (...args) => new Class(...args)
}
