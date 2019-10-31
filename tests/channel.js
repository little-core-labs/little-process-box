const path = require('path')
const test = require('tape')

const { Process } = require('../process')
const { Channel } = require('../channel')

const WORK = path.resolve(__dirname, '..', 'fixtures', 'work.js')
const ECHO_CHANNEL = path.resolve(__dirname, '..', 'fixtures', 'echo-channel.js')

// `stdin` hangs process
process.stdin.unref()

test('const channel = new Channel(process)', (t) => {
  const channel = new Channel(process)
  const child = new Process('node', [ WORK ], { stdio: 'inherit' })
  t.equal(false, channel.destroyed)
  t.ok(process === channel.process)
  t.ok(channel.channels)
  child.open((err) => {
    t.error(err)
    channel.close((err) => {
      t.error(err)
      child.close((err) => {
        t.error(err)
        t.end()
      })
    })
  })
})

test('channel - SMC types', (t) => {
  const types = []
  const channel = new Channel(process, { types })
  t.ok(types === channel.channels._types)
  t.end()
})

test('channel - no pipe/ipc', (t) => {
  const child = new Process('node', [ WORK ], { stdio: 'inherit' })
  child.open((err) => {
    const channel = new Channel(child)
    t.equal(false, channel.send(Buffer.from('hello')))
    child.close((err) => {
      t.end()
    })
  })
})

test('channel - echo pipe', (t) => {
  const echo = new Process('node', [ ECHO_CHANNEL ], { stdio: 'pipe' })
  echo.open((err) => {
    const channel = new Channel(echo)
    channel.send(Buffer.from('hello'))
    channel.on('message', (message) => {
      t.ok(0 === Buffer.compare(message, Buffer.from('hello')))
      channel.close(() => {
        echo.close(() => {
          t.end()
        })
      })
    })
  })
})

test('channel - echo ipc', (t) => {
  const echo = new Process('node', [ ECHO_CHANNEL ], {
    stdio: [0, 1, 2, 'ipc' ]
  })

  echo.open((err) => {
    const channel = new Channel(echo)
    channel.send(Buffer.from('hello'))
    channel.on('message', (message) => {
      t.ok(0 === Buffer.compare(message, Buffer.from('hello')))
      channel.close(() => {
        echo.close(() => {
          t.end()
        })
      })
    })
  })
})

test('channel - double close', (t) => {
  const channel = new Channel(process)
  channel.close()
  channel.close((err) => {
    t.ok(err)
    t.end()
  })
})
