const { ProcessPool } = require('./pool')
const { Service } = require('./service')
const { Pool } = require('nanoresource-pool')
const assert = require('nanoassert')
const mutex = require('mutexify')
const Batch = require('batch')
const names = require('./data/names')

// quick util
const randomItem = (a) => a[Math.random() * a.length % a.length | 0]
const noop = () => void 0

/**
 * The `SupervisorProcessPool` class represents an extended `ProcessPool`
 * that creates `Service` instances as the process resource.
 * @class
 * @extends ProcessPool
 */
class SupervisorProcessPool extends ProcessPool {

  /**
   * `SupervisorProcessPool` class constructor.
   * @param {Object} opts
   * @param {String} opts.name
   */
  constructor(opts) {
    if (!opts || 'object' !== typeof opts) {
      opts = {}
    }

    super(Service, opts)
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
    opts = Object.assign({ autoOpen: false }, opts) // copy
    super(SupervisorProcessPool, opts)
    this.autoOpen = Boolean(opts.autoOpen)
  }

  /**
   * A list of all `SupervisorProcessPool` instances.
   * @accessor
   */
  get pools() {
    return this.list()
  }

  /**
   * `true` if the supervisor has successfully started.
   * @accessor
   */
  get started() {
    return this.opened
  }

  /**
   * `true` if the supervisor is in the middle of starting.
   * @accessor
   */
  get starting() {
    return this.opening
  }

  /**
   * Creates a new `SupervisorProcessPool` instance.
   * @param {?(Object)} opts
   */
  pool(opts) {
    return this.resource(opts, { autoOpen: this.autoOpen })
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

    if (!opts.pool) {
      process.nextTick(() => pool.open())
    }

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
          if (stats) {
            Object.defineProperty(stats, 'service', {
              enumerable: false,
              get: () => service
            })
          }

          next(err, stats)
        }))
      }
    }

    batch.end(callback)
  }

  /**
   * Starts all services in all pools calling `callback(err)` upon success
   * or error.
   * @param {?(Function)} callback
   */
  start(callback) {
    if ('function' !== typeof callback) {
      callback = noop
    }

    const services = this.query()
    const batch = new Batch()

    for (const service of services) {
      batch.push((next) => service.start(next))
    }

    batch.end((err) => {
      this.open(callback)
    })
  }

  /**
   * Stops all services in all pools calling `callback(err)` upon success
   * or error.
   * @param {?(Function)} callback
   */
  stop(callback) {
    if ('function' !== typeof callback) {
      callback = noop
    }

    this.close((err) => {
      if (err) { return callback(err) }
      this.closed = false
      this.closing = false
      this.opened = false
      this.opening = false
      callback(err)
    })
  }

  /**
   * Restarts all services in all pools calling `callback(err)` upon success
   * or error.
   * @param {?(Function)} callback
   */
  restart(callback) {
    if ('function' !== typeof callback) {
      callback = noop
    }

    this.stop((err) => {
      if (err) { return callback(err) }
      this.start(callback)
    })
  }
}

/**
 * Module exports.
*/
module.exports = {
  SupervisorProcessPool,
  Supervisor,
}
