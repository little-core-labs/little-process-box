const { ProcessPool, Supervisor, } = require('./')
// TODO

const supervisor = new Supervisor()
supervisor.service('http', {
  exec: 'node',
  args: ['./fixtures/http-service.js'],
  stdio: 'inherit'
})

supervisor.ready(() => {
  console.log('ready');
  const pools = supervisor.pools
  supervisor.stat(console.log)
  //console.log(pools);
})
