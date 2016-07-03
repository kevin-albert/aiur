const socket = require('net').Socket()
const readline = require('readline')
const PORT = 9027
const id = require('node-uuid').v4()

const argv = process.argv.splice(2)
if (!argv.length) {
  console.log('missing hostname')
  process.exit(1)
}

const host = argv[0]

function sendCommand(cmd, arg, callback) {
  socket.write(JSON.stringify({id: id, cmd: cmd, arg: arg}), callback)
}

const actions = {
  ls:   (arg, callback) => sendCommand('ls',   arg, callback),
  use:  (arg, callback) => sendCommand('use',  arg, callback),
  exec: (arg, callback) => sendCommand('exec', arg, callback),
  quit: (arg, callback) => {
    console.log('Goodbye\n')
    socket.end()
    rl.close()
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: (line) => {
    var hits = Object.keys(actions).filter((c) => { return c.indexOf(line) == 0 })
    return [hits.length ? hits : commands, line]
  }
})

rl.setPrompt('> ')
rl.on('line', (line) => {
  if (!line.trim()) return
  var args = line.split(/[ \t]+/)
  var cmd = args[0]
  var arg = line.substr(cmd.length).trim()
  if (actions[cmd]) {
    actions[cmd](arg, commandLoop)
  } else {
    console.log(`unknown action: '${cmd}'`)
    commandLoop()
  }
})

socket.on('data', (data) => {
  var msg = JSON.parse(data)
  switch (msg.cmd) {
    case 'ls':
      console.log('zealots')
      msg.zealots.forEach(zealot => {
        console.log(`"${zealot.name}":`)
        console.log(`  status:        ${zealot.status}`)
        console.log(`  connected:     ${zealot.connected}`)
        console.log(`  disconnected:  ${zealot.disconnected}`)
        console.log(`  data:          ${JSON.stringify(zealot.data)}`)
      })
  }
})

function commandLoop() {
  rl.prompt()
}

var connectDelay = 100

function connect() {
  socket.connect({
    host: host,
    port: PORT
  }, () => {
    connectDelay = 100
    commandLoop()
  })
}

socket.on('error', (error) => {
  console.log(error)

  // exponential retry
  if (connectDelay < 10000)
    connectDelay *= 1.5

  setTimeout(() => {
    console.log('Reconnecting')
    socket.connect({host: host, port: PORT})
  }, connectDelay)
})

connect()
