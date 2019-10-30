const spawn = require('cross-spawn')
const path = require('path')

spawn('node', [path.resolve(__dirname, 'crash.js')]).on('exit', process.exit)
