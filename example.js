const { ProcessPool, Supervisor, } = require('./')
// TODO

const supervisor = new Supervisor()
supervisor.service('http', {
  exec: 'node',
  args: ['./fixtures/http-service.js'],
  stdio: 'inherit'
})

supervisor.start((err) => {
  console.log('error', err);
  console.log('ready');
  supervisor.stat(console.log)
  setTimeout(() => {
    supervisor.stop()
  }, 2000)
})
