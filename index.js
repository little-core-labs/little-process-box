const { ProcessPool } = require('./pool')

/**
 * The top level module exports for the 'little-process-box' module.
 * @public
 * @namespace little-process-box
 * @type {Function|Object}
 */
module.exports = Object.assign(factory(ProcessPool), {
  // factories
  pool: factory(ProcessPool),

  // classes
  ProcessPool,
})

function factory(Class) {
  return (...args) => new Class(...args)
}
