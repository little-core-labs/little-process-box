const spawn = require('cross-spawn')
const path = require('path')

spawn('node', [path.resolve(__dirname, 'work.js')])
