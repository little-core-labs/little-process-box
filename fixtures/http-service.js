const http = require('http')
console.error('starting http service')
const server = http.createServer((res) => res.end('ok')).listen(0, () => {
  setTimeout(() => console.log(JSON.stringify(server.address())), 500)
})
