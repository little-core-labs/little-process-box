const { Process, Channel } = require('../')

if (-1 === process.argv.indexOf('--child')) {
  const child = new Process('node', [ __filename, '--child'], {
    //stdio: 'inherit',
    //stdio: 'pipe',
    //stdio: ['inherit', 'ipc'],
    stdio: [0, 1, 2, 'ipc']
  })

  child.open((err) => {
    err && console.error(err)
    const channel = new Channel(child)
    channel.send(Buffer.from('hello'))
    child.stderr && child.stderr.pipe(process.stderr)
    channel.on('message', (m) => {
      console.error('from child: %s', m);
      channel.close((err) => {
        child.close((err) => {
        })
      })
    })
  })
} else {
  const channel = new Channel(process)
  channel.send(Buffer.from('goodbye'))
  channel.on('message', (m) => {
    console.error('from parent: %s', m);
  })
}
