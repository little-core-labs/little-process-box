const { Process } = require('./process')
const { Pool } = require('nanoresource-pool')
const assert = require('nanoassert')
const onexit = require('async-exit-hook')
const debug = require('debug')('little-process-box:pool')
const Batch = require('batch')
const popen = require('open')

// quick util
const errback = (p, cb) => void p.then((r) => cb(null, r), cb).catch(cb)
const open = (pathspec, opts, cb) => errback(popen(pathspec, opts), cb)

/**
 * A `Set` of `ProcessPool` instances that are closed when
 * the process exits.
 * @private
 */
// istanbul ignore next
const pools = new Set()

// Handle main process exit
onexit((done) => {
  let count = 0
  const batch = new Batch()

  for (const pool of pools) {
    if (!pool.closed && !pool.closing) {
      ++count
      debug('onexit: queue: #%d has %d actives out of %d children',
        count, pool.actives, pool.size)
      batch.push((next) => pool.close(next))
    }
  }

  batch.end((err) => {
    if (err) {
      debug('onexit: error:', err)
    } else {
      debug('onexit: closed %d pools', count)
    }

    done(err)
  })
})

/**
 * The `ProcessPool` class represents a container of running processes
 * managed by the instance. This class extends the `Pool` class from the
 * 'nanoresource-pool' module.
 * @public
 * @class
 * @extends Pool
 */
class ProcessPool extends Pool {

  /**
   * `ProcessPool` class constructor.
   * @param {?(Function)} Factory
   */
  constructor(Factory, opts) {
    if (Factory && 'object' === typeof Factory) {
      opts = Factory
      Factory = null
    }

    opts = Object.assign({ autoOpen: false }, opts) // copy
    super(Factory || Process, opts)
    pools.add(this)
  }

  /**
   * Creates and spawns a command in a new process managed
   * by the pool.
   * @param {String} command
   * @param {?(Array)} args
   * @param {?(Object)} opts
   * @return {Process}
   */
  spawn(command, args, opts) {
    return this.resource(command, args, opts)
  }

  /**
   * Collects the stats of all running process calling `callback(err, stats)`
   * upon success or error. The `where` object can be used to filter the
   * results that get queried for stats.
   * @param {?(Object)} where
   * @param {Function} callback
   */
  stat(where, callback) {
    if ('function' === typeof where) {
      callback = where
      where = {}
    }

    assert('function' === typeof callback, 'Callback must be a function.')
    assert(where && 'object' === typeof where, '"where" must be an object.')

    const children = this.query(where)
    const batch = new Batch()

    for (const child of children) {
      batch.push((next) => child.stat(next))
    }

    batch.end((err, stats) => {
      if (err) { return callback(err) }
      if (false === Array.isArray(stats)) {
        stats = [ stats ].filter()
      }

      callback(err, stats)
    })
  }

  /**
   * Launches a program by way of an input `pathspec` that may be an
   * application URL, path to an application directory, or something
   * suitable for the operating system to launch ("open").
   *
   * @param {String} pathspec
   * @param {?(Object)} opts
   * @return {Process}
   */
  // istanbul ignore function
  launch(pathspec, opts) {
    opts = Object.assign({ spawn }, opts) // copy
    return this.resource(pathspec, opts)

    function spawn(pathspec, args, opts, callback) {
      if (!opts.app) {
        opts.app = [ false, ...args]
      }

      process.nextTick(open, pathspec, opts, callback)
    }
  }
}

/**
 * Module exports.
 */
module.exports = {
  ProcessPool,
}
