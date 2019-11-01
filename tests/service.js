const path = require('path')
const test = require('tape')

const { ProcessPool } = require('../pool')
const { Service } = require('../service')

test('const service = new Service(opts)', (t) => {
  const args = [ path.resolve('.', 'fixtures', 'http-service.js') ]
  const pool = new ProcessPool()
  const service = new Service({
    exec: 'node', env: process.env,
    pool, args,
  })

  t.ok(args === service.args)
  t.ok(pool === service.pool)
  t.notOk(service.type)
  t.notOk(service.stdin)
  t.notOk(service.stdout)
  t.notOk(service.stderr)
  t.ok(service.env === process.env)
  t.ok(service.name && 'string' === typeof service.name)
  t.ok(Array.isArray(service.args))
  t.ok(!service.description && 'string' === typeof service.description)
  t.equal('node', service.exec)
  t.equal(false, service.started)
  t.equal(false, service.starting)

  service.start((err) => {
    t.error(err)
    t.ok(service.stdin)
    t.ok(service.stdout)
    t.ok(service.stderr)
    t.equal(true, service.started)
    t.equal(false, service.starting)

    service.stdout.once('data', (data) => {
      const { port } = JSON.parse(data)
      t.ok(port && 'number' === typeof port)
      service.stop((err) => {
        t.error(err)
        t.ok(service.stopped)
        t.end()
      })
    })
  })

  t.equal(true, service.starting)
})

test('const service = new Service() - defaults', (t) => {
  const service = new Service()
  t.ok(service.env && 'object' === typeof service.env)
  t.ok(null === service.pool)
  t.end()
})

test('service.restart([callback])', (t) => {
  const service = new Service({
    exec: 'node',
    args: [ path.resolve('.', 'fixtures', 'http-service.js') ],
  })

  service.start((err) => {
    service.stderr.pipe(process.stderr)
    service.stdout.once('data', (data) => {
      const { port } = JSON.parse(data)
      t.ok(port && 'number' === typeof port)
      service.restart((err) => {
        t.error(err)
        service.close((err) => {
          t.error(err)
          t.end()
        })
      })
    })
  })
})

test('service.createLogStream()', (t) => {
  const service = new Service({
    exec: 'node',
    args: [ path.resolve('.', 'fixtures', 'service-log.js'), 'hello' ],
    stdio: 'pipe'
  })

  service.start((err) => {
    t.error(err)
    const stream = service.createLogStream()
    stream.once('data', (d) => {
      t.equal('hello', String(d).trim())
      service.stop((err) => {
        t.error(err)
        t.end()
      })
    })
  })
})

test('service.createLogStream() - stopped service', (t) => {
  const service = new Service({
    exec: 'node',
    args: [ path.resolve('.', 'fixtures', 'service-log.js'), 'hello' ],
  })

  const stream = service.createLogStream()
  t.ok(stream)
  stream.on('end', () => {
    t.pass()
    t.end()
  })
})
