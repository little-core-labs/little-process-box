const SimpleMessageChannel = require('simple-message-channels')
const { EventEmitter } = require('events')
const assert = require('nanoassert')

// quick util
const bind = (o, f) => (...args) => f.call(o, ...args)

/**
 * The `Channel` class represents a channel for a running process that
 * leverages IPC channels falling back to `stdin` and `stdout` streams to
 * send and receive messages on.
 * @class
 * @extends EventEmitter
 */
class Channel extends EventEmitter {

  /**
   * `Channel` class constructor.
   * @param {Process} child
   * @param {?(Object)} opts
   */
  constructor(child, opts) {
    super()
    this.setMaxListeners(0)

    if (!opts || 'object' !== typeof opts) {
      opts = {}
    }

    assert(child.opened || global.process === child,
      'Expecting process to be a `nanoprocess` or `global.process`.')

    this.ondata  = bind(this, this.ondata)
    this.onerror = bind(this, this.error)
    this.onmessage = bind(this, this.onmessage)
    this.onmissing = bind(this, this.onmissing)

    this.process = child
    this.destroyed = false
    this.channels = new SimpleMessageChannel({
      context: this,
      types: opts.types,
      onmessage: this.onmessage,
      onmissing: this.onmissing,
    })

    if (this.process === global.process && this.process.stdin) {
      this.process.stdin.on('data', this.ondata)
    } else if (this.process.stdout) {
      this.process.stdout.on('data', this.ondata)
    }

    if (this.process.channel) {
      const onmessage = (message) => this.ondata(Buffer.from(message))
      this.process.on('message', onmessage)
      this.once('close', () => {
        this.process.removeListener('message', onmessage)
      })
    }

    this.once('close', () => {
      // istanbul ignore next
      if (this.process) {
        if (this.process.stdout) {
          this.process.stdout.removeListener('data', this.ondata)
        }

        if (this.process.stdin) {
          this.process.stdin.removeListener('data', this.ondata)
        }

        this.process.removeListener('error', this.onerror)
      }
    })

    if (this.process !== global.process) {
      this.process.on('error', this.onerror)
    }
  }

  /**
   * Instance level error handler to emit `err` when called.
   * @protected
   * @param {?(Error)} err
   * @emits error
   */
  onerror(err) {
    // istanbul ignore next
    if (err) {
      // istanbul ignore next
      this.emit('error', err)
    }
  }

  /**
   * Instance level data handler to receive sent messages into
   * the message channel.
   * @protected
   * @param {Buffer} data
   * @emits data
   */
  ondata(data) {
    if (this.channels.recv(data)) {
      this.emit('data', data)
    }
  }

  /**
   * Instance level handler for missing/unhandled bytes in message channel.
   * @protected
   * @param {Number} bytes
   * @emits missing
   */
  onmissing(bytes) {
    // istanbul ignore next
    this.emit('missing', bytes)
  }

  /**
   * Instance level handler for incoming message channel messages.
   * @protected
   * @param {Number} channel
   * @param {Number} type
   * @param {Buffer} message
   * @emits message
   */
  onmessage(channel, type, message) {
    this.emit('message', message, channel, type)
  }

  /**
   * Sends a `buffer` to the process through the message channel.
   * @param {Buffer} buffer
   * @param {?(Object)} opts
   * @param {?(Object)} opts.id
   * @param {?(Object)} opts.type
   * @return {Boolean}
   */
  send(buffer, opts) {
    // istanbul ignore next
    if (!opts || 'object' !== typeof opts) {
      opts = {}
    }

    const message = this.channels.send(opts.id || 0, opts.type || 0, buffer)
    if (this.process.channel && 'function' === typeof this.process.send) {
      return this.process.send(message)
    } else if (this.process === global.process) {
      return this.process.stdout.write(message)
    } else if (this.process.stdin) {
      return this.process.stdin.write(message)
    } else {
      return false
    }
  }

  /**
   * Closes channel calling `callback(err)` upon success or error.
   * @param {?(Function)} callback
   * @emits close
   */
  close(callback) {
    if (this.destroyed) {
      // istanbul ignore next
      if ('function' === typeof callback) {
        process.nextTick(callback, new Error('Channel closed.'))
      }

      return
    }

    if ('function' === typeof callback) {
      this.once('close', () => callback(null))
    }

    this.destroy()
  }

  /**
   * Close process message channel and cleans up all resources.
   * @param {?(Error)} err
   * @emits close
   */
  destroy(err) {
    this.channels.destroy(err)
    this.destroyed = true
    process.nextTick(() => this.emit('close'))
    // istanbul ignore next
    if (err) {
      this.emit('error', err)
    }
  }
}

/**
 * Module exports.
 */
module.exports = {
  Channel
}
