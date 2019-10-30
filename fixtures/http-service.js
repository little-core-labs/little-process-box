const http = require('http')
const server = http.createServer().listen(0, () => {
  console.log(JSON.stringify(server.address()))
})
