const { ProcessPool } = require('./pool')
const { Service } = require('./service')
const { Pool } = require('nanoresource-pool')
const assert = require('nanoassert')
const Batch = require('batch')
const names = require('./data/names')

// quick util
const randomItem = (a) => a[Math.random() * a.length % a.length | 0]

/**
 * @class
 * @extends ProcessPool
 */
class SupervisorProcessPool extends ProcessPool {

  /**
   * `SupervisorProcessPool` class constructor.
   * @param {Object} opts
   */
  constructor(opts) {
    if (!opts || 'object' !== typeof opts) {
      opts = {}
    }

    super(Service)
    this.name = opts.name || randomItem(names)
  }
}

/**
 * The `Supervisor` class represents a higher level container for
 * `ProcessPool` instances in which it provides abilities to manage processes
 * as services with consolidated logging, mutex locks, graceful shutdowns, and
 * connected message channels.
 * @public
 * @class
 * @extends Pool<ProcessPool>
 */
class Supervisor extends Pool {

  /**
   * The `Supervisor` class constructor.
   * @param {Object} opts
   */
  constructor(opts) {
    super(SupervisorProcessPool)
  }

  /**
   * A list of all `SupervisorProcessPool` instances.
   * @accessor
   */
  get pools() {
    return this.list()
  }

  /**
   * Creates a new `SupervisorProcessPool` instance.
   * @param {?(Object)} opts
   */
  pool(opts) {
    return this.resource(opts)
  }

  /**
   * Creates a named service with options from a new or
   * given `SupervisorProcessPool`.
   * @param {?(String)} name
   * @param {Object} opts
   * @param {?(SupervisorProcessPool)} opts.pool
   * @return {Service}
   */
  service(name, opts) {
    if ('object' === typeof name) {
      opts = name
      name = opts.name
    }

    assert(opts && 'object' === typeof opts, 'Options must be a object.')
    opts.name = name
    assert(opts.name && 'string' === typeof opts.name, 'Name must be a string.')
    const pool = opts.pool || this.pool()
    const service = pool.resource(opts)
    return Object.assign(service, { pool })
  }

  /**
   * Queries all services in all process pools based on an optional
   * `where` filter calling `callback(err, results)` upon success or
   * error.
   * @param {?(Object)} where
   * @param {Function} callback
   */
  stat(where, callback) {
    if ('function' === typeof where) {
      callback = where
      where = {}
    }

    assert('function' === typeof callback, 'Callback must be a function.')
    assert(where && 'object' === typeof where, '`where` must be an object.')

    const services = this.query(where) // will query pools
    const batch = new Batch()
    for (const service of services) {
      if ('function' === typeof service.stat) {
        batch.push((next) => service.stat((err, stats) => {
          if (stats) { stats.service = service }
          next(err, stats)
        }))
      }
    }

    batch.end(callback)
  }
}

/**
 * Module exports.
*/
module.exports = {
  Supervisor,
}
