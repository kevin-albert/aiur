const ZEALOT_PORT = 9026
const ARCHON_PORT = 9027
const net = require('net')
const zealots = require('./zealots')
const archons = require('./archons')
const msg = require('./msg')

// typer server
net.createServer((socket) => {
  console.log(`archon connected`)
  var channel = null
  socket.on('data', (data) => {
    console.log(`receiving data: ${data}`)
    var msg = JSON.parse(data)
    switch (msg.cmd) {
      case 'ls':
        var list = zealots.list().map(zealot => {
          return {
            id: zealot.id,
            name: zealot.name,
            status: zealot.status,
            connected: zealot.connected,
            disconnected: zealot.disconnected,
            data: zealot.data
          }
        })

        // return list wrapped in JSON object
        socket.write(JSON.stringify({cmd: 'ls', zealots: list}))
        break
      case 'use':
        // use
        if (channel) {

        }
        break
      case 'exec':
        // exec
        break
      default:
        console.log(`unknown command: ${msg.cmd}`)
    }
  })
}).listen({port: ARCHON_PORT}, () => console.log(`listening for typers on ${ARCHON_PORT}`))

// executor server
net.createServer((socket) => {
  executors.handleSocket(socket)
}).listen({port: ZEALOT_PORT}, () => console.log(`listening for executors on ${ZEALOT_PORT}`))
