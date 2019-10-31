const { Channel } = require('../channel')
const channel = new Channel(process)
channel.on('message', (message) => {
  channel.send(message)
})
