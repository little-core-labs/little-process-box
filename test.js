const path = require('path')
const test = require('tape')

const { ProcessPool } = require('./pool')
const processbox = require('./')

test('processbox.pool()', (t) => {
  const pool = processbox.pool()
  const work = pool.spawn('node', [path.join('.', 'fixtures', 'work.js')])
  work.open((err) => {
    t.error(err)
    work.close((err) => {
      t.error(err)
      t.end()
    })
  })
})

test('const pool = ProcessPool()', (t) => {
  const pool = new ProcessPool()
  const work = pool.spawn('node', [path.join('.', 'fixtures', 'work.js')])
  work.open((err) => {
    t.error(err)
    work.close(true, (err) => {
      t.error(err)
      t.end()
    })
  })
})
