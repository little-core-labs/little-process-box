const { Process } = require('./process')
const through = require('through2')
const assert = require('nanoassert')
const names = require('./data/names')
const pump = require('pump')
const os = require('os')

const DEFAULT_STDIO = [ 'pipe', 'pipe', 'pipe', 'ipc' ]
// istanbul ignore next
const NOOP_EXEC = 'win32' === os.platform()
  ? 'rundll32' // https://superuser.com/a/389288
  : ':'

// quick util
const randomItem = (a) => a[Math.random() * a.length % a.length | 0]
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
    if (opts) {
      assert('object' === typeof opts, 'Options must be an object.')
    }

    opts = Object.assign({ stdio: DEFAULT_STDIO }, opts) // copy

    super(opts.exec || NOOP_EXEC, opts.args, opts)

    this.env = opts.env || {}
    this.pool = opts.pool || null
    this.type = opts.type || null
    this.name = opts.name || randomItem(names)
    this.exec = opts.exec || NOOP_EXEC
    this.args = opts.args || []
    this.description = opts.description || ''
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
   * `true if the service is stopped.
   * @accessor
   */
  get stopped() {
    return !this.opened && !this.opening && !this.closing && this.closed
  }

  /**
   * Starts the services calling `callback(err)` upon success
   * or error.
   * @param {?(Function)} callback
   */
  start(callback) {
    // istanbul ignore next
    if ('function' !== typeof callback) {
      callback = noop
    }

    this.closed = false
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
    // istanbul ignore next
    if ('function' !== typeof callback) {
      callback = noop
    }

    this.close((err) => {
      // istanbul ignore next
      if (err) { return callback(err) }
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
    // istanbul ignore next
    if ('function' !== typeof callback) {
      callback = noop
    }

    this.stop((err) => {
      // istanbul ignore next
      if (err) { return callback(err) }
      this.start(callback)
    })
  }

  /**
   * Returns a readable stream to the caller that pipes `stderr` from the
   * running service to the stream. If the service does not have a
   * readable `stderr` stream, then the returned stream will automatically
   * end.
   * @return {ReadableStream}
   */
  createLogStream() {
    const stream = through()

    if (this.stderr) {
      pump(this.stderr, stream)
    } else {
      process.nextTick(() => stream.push(null))
      process.nextTick(() => stream.end())
      process.nextTick(() => stream.emit('end'))
    }

    return stream
  }
}

/**
 * Module exports.
 */
module.exports = {
  Service,
}
