const socket = require('net').Socket()
const readline = require('readline')
const PORT = 9027

const argv = process.argv.splice(2)
if (!argv.length) {
  console.log('missing hostname')
  process.exit(1)
}

const actions = {
  ls: (arg, callback) => {
    socket.write(JSON.stringify({cmd: 'ls', arg: arg}), callback)
  },
  use: (arg, callback) => {
    socket.write(JSON.stringify({cmd: 'use', arg: arg}), callback)
  },
  exec: (arg, callback) => {
    socket.write(JSON.stringify({cmd: 'exec', arg: arg}), callback)
  },
  quit: (arg, callback) => {
    console.log('Goodbye\n')
    socket.end()
    rl.close()
  }
}

const commands = Object.keys(actions)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: (line) => {
    var hits = commands.filter((c) => { return c.indexOf(line) == 0 })
    return [hits.length ? hits : commands, line]
  }
})

rl.setPrompt('T> ')

rl.on('line', (line) => {
  var args = line.split(/\s+/, 1)
  var cmd = args[0]
  var arg = cmd.length > 1 ? cmd[1] : ''
  if (actions[cmd]) {
    actions[cmd](arg, commandLoop)
  } else {
    console.log(`unknown action: '${cmd}'`)
    commandLoop()
  }
})

function commandLoop() {
  rl.prompt()
}

socket.connect({
  host: argv[0],
  port: PORT
}, () => {
  commandLoop()
})
