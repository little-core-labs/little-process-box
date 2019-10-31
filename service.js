const { Process } = require('./process')
const assert = require('nanoassert')

// quick util
const noop = () => void 0

/**
 * The `Service` class represents a named process that can be started,
 * restarted, and stopped.
 * @class
 * @extends Process
 */
class Service extends Process {

  /**
   * `Service` class constructor.
   * @param {Object} opts
   */
  constructor(opts) {
    assert(opts && 'object' === typeof opts, 'Options must be an object.')
    opts = Object.assign({ stdio: 'pipe' }, opts) // copy

    super(opts.exec, opts.args, opts)

    this.env = opts.env || {}
    this.pool = opts.pool || null
    this.type = opts.type
    this.name = opts.name
    this.exec = opts.exec
    this.args = opts.args
    this.description = opts.description
  }

  /**
   * Writable stream for `stdin`.
   * @accessor
   */
  get stdin() {
    return this.process && this.process.stdin
  }

  /**
   * Readable stream for `stdout`.
   * @accessor
   */
  get stdout() {
    return this.process && this.process.stdout
  }

  /**
   * Readable stream for `stderr`.
   * @accessor
   */
  get stderr() {
    return this.process && this.process.stderr
  }

  /**
   * `true` if the service has successfully started.
   * @accessor
   */
  get started() {
    return this.opened
  }

  /**
   * `true` if the service is in the middle of starting.
   * @accessor
   */
  get starting() {
    return this.opening
  }

  /**
   * Starts the services calling `callback(err)` upon success
   * or error.
   * @param {?(Function)} callback
   */
  start(callback) {
    if ('function' !== typeof callback) {
      callback = noop
    }

    this.open(callback)
  }

  /**
   * Stops the services calling `callback(err)` upon success
   * or error. This function will reset the `nanoresource`
   * state (opened, opening, closed, closing, actives) to their
   * initial values.
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
      this.actives = 0
      callback(err)
    })
  }

  /**
   * Restarts the services calling `callback(err)` upon success
   * or error. This function will call `service.stop(callback)`
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
  Service,
}
