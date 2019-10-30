const { fork } = require('child_process')
const path = require('path')

fork(path.resolve(__dirname, 'spawn.js'))
